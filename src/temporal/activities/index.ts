import { sendBookingConfirmationEmail } from "../../mailer/booking.mailer.js";
import { regenerateHostSlots, RegenerateHostSlotsInput } from "../../services/slot.services.js";

export async function regenerateHostSlotsActivity(input: RegenerateHostSlotsInput) {
    await regenerateHostSlots(input);
}

export async function sendBookingConfirmationEmailActivity(bookingId: number) {
    await sendBookingConfirmationEmail(bookingId);
}