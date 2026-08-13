import { DateTime } from "luxon";
import { SLOT_GENRATION_DAYS } from "../config/env.js";
import { findActiveRulesByUser, findExceptionsByUserInRange } from "../repositories/availability.repository.js";
import { findActiveEventTypesByHost } from "../repositories/event-type.repository.js";
import { blockSlot, findBookedSlotsByHostInRange, findFutureSlotsByEventTypeInRange, upsertAvailableSlot } from "../repositories/slot.repository.js";
import { getById as getUserById } from "../repositories/user.repository.js";
import { applyExceptionsForDate, overlapsBooked, splitIntoSlots, TimeWindow, windowsForWeekdayRule } from "./slot-generation.service.js";

export interface RegenerateHostSlotsInput {
    hostId: number;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
}

export async function regenerateHostSlots(input: RegenerateHostSlotsInput) {
    const host = await getUserById(input.hostId);
    if(!host) return;

    const from = input.from 
        ? DateTime.fromISO(input.from, { zone: 'utc' }).startOf('day') // 2026-06-01 -> 2026-06-01T00:00:00:000Z
        : DateTime.now().startOf('day').toUTC(); // this should be in utc also

    const to = input.to 
        ? DateTime.fromISO(input.to, { zone: 'utc' }).endOf('day') // 2026-06-01 -> 2026-06-01T23:59:59:999Z
        : from.plus({ days: SLOT_GENRATION_DAYS}).endOf('day').toUTC();

    
    const [rules, exceptions, eventTypes, bookedSlots] = await Promise.all([
        findActiveRulesByUser(input.hostId),
        findExceptionsByUserInRange(input.hostId, from.toJSDate(), to.toJSDate()),   // exceptions stored as JS Date in db, so luxon range needs conversion to fetch correctly
        findActiveEventTypesByHost(input.hostId),
        findBookedSlotsByHostInRange(input.hostId, from.toJSDate(), to.toJSDate()),
    ]);

    // convert booked slots into time windows -> compatible with luxon
    const bookedWindows: TimeWindow[] = bookedSlots.map((slot) => {
        return {
            start: DateTime.fromJSDate(slot.startAt, { zone: 'utc' }),  // db gives JS Date, convert to luxon DateTime to use in TimeWindow
            end: DateTime.fromJSDate(slot.endAt, { zone: 'utc' }),
        }
    });


    for(const eventType of eventTypes) {

        // tracks every slot (as a unique key) that is still valid after this regeneration run for this eventType
        // used later to figure out which previously generated slots are now stale and need to be blocked
        const generatedValidSlotKeys = new Set<string>(); 

        for(let cursor = from; cursor <= to; cursor = cursor.plus({ days: 1 })) {
            const dateKey = cursor.toISODate(); // 2026-06-01

            const dayExceptions = exceptions.filter((ex) => DateTime.fromJSDate(ex.date, { zone: 'utc'}).toISODate() === dateKey);
            const dayExceptionsWithTimeZone = dayExceptions.map((ex) => ({
                type: ex.type,
                startTime: ex.startTime,
                endTime: ex.endTime,
                timeZone: ex.timezone,
            }));


            let windows: TimeWindow[] = [];

            // convert rules into time windows -> compatible with luxon
            for(const rule of rules) {
                windows.push(...windowsForWeekdayRule(cursor, rule.weekday, rule.startTime, rule.endTime, rule.timezone));
            }

            // apply exceptions to the windows
            windows = applyExceptionsForDate(cursor, windows, dayExceptionsWithTimeZone);

            const slots = splitIntoSlots(
                windows, // windows on which exceptions are applied
                eventType.durationMinutes,
                eventType.bufferBeforeMinutes,
                eventType.bufferAfterMinutes,
            ).filter(
                (slot) => slot.start > DateTime.utc() && !overlapsBooked(slot, bookedWindows, eventType.bufferBeforeMinutes, eventType.bufferAfterMinutes)
            ); // slots filtered to exclude past slots and slots that overlap with booked slots

            // I dont like this query too much.
            for(const slot of slots) {
                const startAt = slot.start.toUTC().toJSDate();
                const endAt = slot.end.toUTC().toJSDate();

                // key uniquely identifies a slot by eventType + exact start/end, so we can compare
                // against what's already in db without needing the slot's db id
                const key = `${eventType.id}|${startAt.toISOString()}|${endAt.toISOString()}`;

                generatedValidSlotKeys.add(key);

                await upsertAvailableSlot(input.hostId, eventType.id, startAt, endAt);
            }
        }

        // fetch all slots currently in db for this eventType in range, so we can diff
        // against what we just generated (generatedValidSlotKeys) to find stale ones
        const futureSlots = await findFutureSlotsByEventTypeInRange(
            eventType.id,
            from.toJSDate(),
            to.toJSDate(),
        );

        for(const slot of futureSlots) {
            const key = `${eventType.id}|${slot.startAt.toISOString()}|${slot.endAt.toISOString()}`;
            if(!generatedValidSlotKeys.has(key)) {
                // this slot is no longer valid
                // e.g. rule/exception changed and this slot's window no longer exists,
                // so we block it instead of deleting (keeps history / avoids race with an in-flight booking)
                await blockSlot(slot.id);
            }
        }


    }
   
}

// invalidSlots = All slots in db - new slots