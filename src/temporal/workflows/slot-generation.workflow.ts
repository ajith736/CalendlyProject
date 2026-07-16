import {proxyActivities} from "@temporalio/workflow"

import type * as activities from "../activities/index.js"
import { RegenerateHostSlotsInput } from "../../services/slot.services.js";

// create the proxy activities

const {regenerateHostSlotsActivity} = proxyActivities<typeof activities>({
    retry:{maximumAttempts:3},
    startToCloseTimeout:'10 minutes',
})

export async function regenerateHostSlotWorkflow(input:RegenerateHostSlotsInput){
    await regenerateHostSlotsActivity(input);
}