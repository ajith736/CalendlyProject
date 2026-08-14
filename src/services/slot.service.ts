import { DateTime } from "luxon";
import { SLOT_GENERATION_DAYS } from "../config/env.js";
import { findActiveRulesByUser, findExceptionsByUserInRange } from "../repositories/availability.repository.js";
import { findActiveEventTypesByHost } from "../repositories/event-type.repository.js";
import { blockSlot, findBookedSlotsByHostInRange, findFutureSlotsByEventTypeInRange, upsertAvailableSlot } from "../repositories/slot.repository.js";
import { getById as getUserById } from "../repositories/user.repository.js";
import { applyExceptionsForDate, overlapsBooked, splitIntoSlots, TimeWindow, windowsForWeekdayRule } from "./slot-generation.service.js";

export interface RegenerateHostSlotsInput {
    hostId: number;
    from?: string;
    to?: string;
}

export async function regenerateHostSlots(input: RegenerateHostSlotsInput) {
    const host = await getUserById(input.hostId);
    if (!host) return;

    const from = input.from
        ? DateTime.fromISO(input.from, { zone: "utc" }).startOf("day")
        : DateTime.now().startOf("day").toUTC();

    const to = input.to
        ? DateTime.fromISO(input.to, { zone: "utc" }).endOf("day")
        : from.plus({ days: SLOT_GENERATION_DAYS }).endOf("day").toUTC();

    const [rules, exceptions, eventTypes, bookedSlots] = await Promise.all([
        findActiveRulesByUser(input.hostId),
        findExceptionsByUserInRange(input.hostId, from.toJSDate(), to.toJSDate()),
        findActiveEventTypesByHost(input.hostId),
        findBookedSlotsByHostInRange(input.hostId, from.toJSDate(), to.toJSDate()),
    ]);

    const bookedWindows: TimeWindow[] = bookedSlots.map((slot) => ({
        start: DateTime.fromJSDate(slot.startAt, { zone: "utc" }),
        end: DateTime.fromJSDate(slot.endAt, { zone: "utc" }),
    }));

    for (const eventType of eventTypes) {
        const generatedValidSlotKeys = new Set<string>();

        for (let cursor = from; cursor <= to; cursor = cursor.plus({ days: 1 })) {
            const dateKey = cursor.toISODate();

            const dayExceptions = exceptions.filter((ex) => DateTime.fromJSDate(ex.date, { zone: "utc" }).toISODate() === dateKey);
            const dayExceptionsWithTimeZone = dayExceptions.map((ex) => ({
                type: ex.type,
                startTime: ex.startTime,
                endTime: ex.endTime,
                timeZone: ex.timezone,
            }));

            let windows: TimeWindow[] = [];

            for (const rule of rules) {
                windows.push(...windowsForWeekdayRule(cursor, rule.weekday, rule.startTime, rule.endTime, rule.timezone));
            }

            windows = applyExceptionsForDate(cursor, windows, dayExceptionsWithTimeZone);

            const slots = splitIntoSlots(
                windows,
                eventType.durationMinutes,
                eventType.bufferBeforeMinutes,
                eventType.bufferAfterMinutes,
            ).filter(
                (slot) => slot.start > DateTime.utc() && !overlapsBooked(slot, bookedWindows, eventType.bufferBeforeMinutes, eventType.bufferAfterMinutes),
            );

            for (const slot of slots) {
                const startAt = slot.start.toUTC().toJSDate();
                const endAt = slot.end.toUTC().toJSDate();

                const key = `${eventType.id}|${startAt.toISOString()}|${endAt.toISOString()}`;
                generatedValidSlotKeys.add(key);

                await upsertAvailableSlot({
                    hostId: input.hostId,
                    eventTypeId: eventType.id,
                    startAt,
                    endAt,
                });
            }
        }

        const futureSlots = await findFutureSlotsByEventTypeInRange(
            eventType.id,
            from.toJSDate(),
            to.toJSDate(),
        );

        for (const slot of futureSlots) {
            const key = `${eventType.id}|${slot.startAt.toISOString()}|${slot.endAt.toISOString()}`;
            if (!generatedValidSlotKeys.has(key)) {
                await blockSlot(slot.id);
            }
        }
    }
}
