import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../activities/index.js";

// Create the proxy activities

const { sendBookingConfirmationEmailActivity } = proxyActivities<typeof activities>({
    retry: { maximumAttempts: 3},
    startToCloseTimeout: '10 minutes',
})

export async function sendBookingConfirmationEmailWorkflow(bookingId: number) {
    await sendBookingConfirmationEmailActivity(bookingId);
}
