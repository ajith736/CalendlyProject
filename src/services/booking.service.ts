import { prisma } from "../config/database.js";
import { CreateBookingDto } from "../dtos/booking.dto.js";
import { createBooking } from "../repositories/booking.repository.js";
import {
    findSlotById,
    lockSlotForUpdate,
    markSlotBooked,
    markSlotBookedIfAvailable,
} from "../repositories/slot.repository.js";
import { badRequest, notFound } from "../utils/api-error.js";
import type { Slot } from "../../generated/prisma/client.js";

function validateSlotForBooking(slot: Slot | null): Slot {
    if (!slot) {
        throw notFound("Slot not found");
    }

    if (slot.status !== "AVAILABLE") {
        throw badRequest("Slot is not available");
    }

    if (slot.startAt <= new Date()) {
        throw badRequest("Slot has already started");
    }

    return slot;
}

function formatBookingResponse(booking: {
    id: number;
    status: string;
    slot: { startAt: Date; endAt: Date };
}) {
    return {
        booking: {
            id: booking.id,
            status: booking.status,
            startAt: booking.slot.startAt.toISOString(),
            endAt: booking.slot.endAt.toISOString(),
        },
    };
}

export async function createBookingOptimistically(userId: number, dto: CreateBookingDto) {
    const booking = await prisma.$transaction(async (tx) => {
        const slot = validateSlotForBooking(await findSlotById(dto.slotId, tx));

        const updated = await markSlotBookedIfAvailable(dto.slotId, tx);

        if (updated.count !== 1) {
            throw badRequest("Slot is not available");
        }

        return createBooking(
            {
                slotId: dto.slotId,
                inviteeEmail: dto.inviteeEmail,
                inviteeName: dto.inviteeName,
                inviteeNotes: dto.inviteeNotes,
                hostId: userId,
                eventTypeId: slot.eventTypeId,
            },
            tx
        );
    });

    return formatBookingResponse(booking);
}

export async function createBookingPessimistically(userId: number, dto: CreateBookingDto) {
    const booking = await prisma.$transaction(async (tx) => {
        const locked = await lockSlotForUpdate(dto.slotId, tx);

        if (locked.length === 0) {
            throw notFound("Slot not found");
        }

        const slot = validateSlotForBooking(await findSlotById(dto.slotId, tx));

        await markSlotBooked(dto.slotId, tx);

        return createBooking(
            {
                slotId: dto.slotId,
                inviteeEmail: dto.inviteeEmail,
                inviteeName: dto.inviteeName,
                inviteeNotes: dto.inviteeNotes,
                hostId: userId,
                eventTypeId: slot.eventTypeId,
            },
            tx
        );
    });

    return formatBookingResponse(booking);
}
