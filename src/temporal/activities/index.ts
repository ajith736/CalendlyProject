import { regenerateHostSlots, RegenerateHostSlotsInput } from "../../services/slot.services.js";

export async function regenerateHostSlotsActivity(input:RegenerateHostSlotsInput){
    await regenerateHostSlots(input);  // here actually the service function is called
}