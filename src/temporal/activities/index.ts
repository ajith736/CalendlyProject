import { sendBookingConfirmationEmail } from "../../mailer/booking.mailer.js";
import { updateBookingCalendarDetails } from "../../repositories/booking.repository.js";
import {
    createGoogleCalendarEvent,
    isProjectCalendarConfigured,
} from "../../services/google-calender.service.js";
import {
    type RegenerateHostSlotsInput,
    regenerateHostSlots,
} from "../../services/slot.service.js";

export async function regenerateHostSlotsActivity(input: RegenerateHostSlotsInput) {
    await regenerateHostSlots(input);
}

export async function sendBookingConfirmationEmailActivity(bookingId: number) {
    await sendBookingConfirmationEmail(bookingId);
}

export async function createGoogleCalendarEventActivity(bookingId: number) {
    if (!isProjectCalendarConfigured()) {
        console.warn("[temporal] Google Calendar not configured, skipping event creation");
        return;
    }

    const result = await createGoogleCalendarEvent(bookingId);

    await updateBookingCalendarDetails(bookingId, {
        meetLink: result.meetLink,
        calendarEventId: result.calendarEventId,
    });
}
