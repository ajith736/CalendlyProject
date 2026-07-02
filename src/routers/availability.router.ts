import { Router } from "express";
import {
    createException,
    createRule,
    listExceptions,
    listRules,
    removeException,
    removeRule,
    updateException,
    updateRule,
} from "../controllers/availability.controller.js";
import {
    createAvailabilityExceptionSchema,
    createAvailabilityRuleSchema,
    updateAvailabilityExceptionSchema,
    updateAvailabilityRuleSchema,
} from "../dtos/availability.dto.js";
import { requireUserId } from "../middlewares/require-user-id.js";
import { validate } from "../middlewares/validate.js";

export const availabilityRouter: Router = Router();

availabilityRouter.use(requireUserId);

availabilityRouter.get("/rules", listRules);
availabilityRouter.post("/rules", validate(createAvailabilityRuleSchema), createRule);
availabilityRouter.patch("/rules/:id", validate(updateAvailabilityRuleSchema), updateRule);
availabilityRouter.delete("/rules/:id", removeRule);

availabilityRouter.get("/exceptions", listExceptions);
availabilityRouter.post("/exceptions", validate(createAvailabilityExceptionSchema), createException);
availabilityRouter.patch("/exceptions/:id", validate(updateAvailabilityExceptionSchema), updateException);
availabilityRouter.delete("/exceptions/:id", removeException);