import { z } from "zod";

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const createBookingSchema = z.object({
    slotId : z.string(),
    inviteeEmail: z.email('Invalid email address'),
    inviteeName: z.string().min(1,'Name is required').max(100,'Name must be less than 100 characters'),
    inviteeNotes: z.string().optional()
});

export const listHostBookingsQuerySchema = z.object({
    status: z.enum(["CONFIRMED", "CANCELLED", "PENDING"]).optional(),
    from: z.string().regex(dateRegex, "from must be in YYYY-MM-DD format").optional(),
    to: z.string().regex(dateRegex, "to must be in YYYY-MM-DD format").optional(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type ListHostBookingsQuery = z.infer<typeof listHostBookingsQuerySchema>;