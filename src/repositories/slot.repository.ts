import { prisma } from "../config/database.js";

export async function findBookedSlotsByHostInRange(hostId: number, startDate: Date, endDate: Date) {
    return prisma.slot.findMany({
        where: {
            hostId,
            startAt: {
                gte: startDate,
                lte: endDate,
            },
            status: "BOOKED"
        },
    })
}

export async function upsertAvailableSlot(input: {
    hostId: number;
    eventTypeId: number;
    startAt: Date;
    endAt: Date;
}) {
    const { hostId, eventTypeId, startAt, endAt } = input;
    return prisma.slot.upsert({
        where: {
            eventTypeId_startAt_endAt: {
                eventTypeId,
                startAt,
                endAt,
            },
        },
        create: {
            hostId,
            eventTypeId,
            startAt,
            endAt,
            status: "AVAILABLE",
        },
        update: {
            status: "AVAILABLE",
        },
    });
}