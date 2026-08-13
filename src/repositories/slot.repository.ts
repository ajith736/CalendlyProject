import { prisma } from "../config/database.js";
import { getDbClient, type DbClient } from "./db-client.js";

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

export async function upsertAvailableSlot(
    hostId: number,
    eventTypeId: number,
    startAt: Date,
    endAt: Date,
) {
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

export async function findFutureSlotsByEventTypeInRange(
    eventTypeId: number,
    startDate: Date,
    endDate: Date,
) {
    return prisma.slot.findMany({
        where: {
            eventTypeId,
            startAt: { gte: startDate, lte: endDate },
            status: { in: ["AVAILABLE", "BLOCKED"] },
        },
    });
}

export async function blockSlot(id: string) {
    return prisma.slot.update({
        where: { id },
        data: { status: "BLOCKED" },
    });
}

export async function findSlotById(id: string, db?: DbClient) {
    const client = getDbClient(db);

    return client.slot.findUnique({
        where: { id },
    });
}

export async function markSlotBookedIfAvailable(id: string, db?: DbClient) {
    const client = getDbClient(db);

    return client.slot.updateMany({
        where: {
            id,
            status: "AVAILABLE",
        },
        data: {
            status: "BOOKED",
        },
    });
}

export async function lockSlotForUpdate(id: string, db?: DbClient) {
    const client = getDbClient(db);

    return client.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM slots
        WHERE id = ${id}
        FOR UPDATE
    `;
}

export async function markSlotBooked(id: string, db?: DbClient) {
    const client = getDbClient(db);

    return client.slot.update({
        where: { id },
        data: { status: "BOOKED" },
    });
}