import { getDbClient, type DbClient } from "./db-client.js";

export interface CreateBookingData {
    slotId: string;
    inviteeEmail: string;
    inviteeName: string;
    inviteeNotes?: string;
    hostId: number;
    eventTypeId: number;
}

export async function createBooking(data: CreateBookingData, db?: DbClient) {
    const client = getDbClient(db);

    return client.booking.create({
        data: {
            ...data,
            status: "CONFIRMED",
        },
        include: {
            slot: true,
        },
    });
}
