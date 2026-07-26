import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../activites/index.js";

const { createGoogleCalendarEventActivity } = proxyActivities<typeof activities>({
    retry: { maximumAttempts: 3 },
    startToCloseTimeout: "10 minutes",
});

export async function createGoogleCalendarEventWorkflow(bookingId: number) {
    await createGoogleCalendarEventActivity(bookingId);
}
