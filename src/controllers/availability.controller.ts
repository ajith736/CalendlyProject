import { Request, Response } from "express";
import {
    createException as createExceptionService,
    createRule as createRuleService,
    listExceptions as listExceptionsService,
    listRules as listRulesService,
    removeException as removeExceptionService,
    removeRule as removeRuleService,
    updateException as updateExceptionService,
    updateRule as updateRuleService,
} from "../services/availability.service.js";
import { sendSuccess } from "../utils/api-response.js";

export async function listRules(req: Request, res: Response) {
    const rules = await listRulesService(req.userId!);
    sendSuccess(res, rules);
}

export async function createRule(req: Request, res: Response) {
    const rule = await createRuleService(req.userId!, req.body);
    sendSuccess(res, rule, 201, "Availability rule created successfully");
}

export async function updateRule(req: Request, res: Response) {
    const { id } = req.params;
    const rule = await updateRuleService(req.userId!, Number(id), req.body);
    sendSuccess(res, rule, 200, "Availability rule updated successfully");
}

export async function removeRule(req: Request, res: Response) {
    const { id } = req.params;
    await removeRuleService(req.userId!, Number(id));
    sendSuccess(res, null, 200, "Availability rule deleted successfully");
}

export async function listExceptions(req: Request, res: Response) {
    const exceptions = await listExceptionsService(req.userId!);
    sendSuccess(res, exceptions);
}

export async function createException(req: Request, res: Response) {
    const exception = await createExceptionService(req.userId!, req.body);
    sendSuccess(res, exception, 201, "Availability exception created successfully");
}

export async function updateException(req: Request, res: Response) {
    const { id } = req.params;
    const exception = await updateExceptionService(req.userId!, Number(id), req.body);
    sendSuccess(res, exception, 200, "Availability exception updated successfully");
}

export async function removeException(req: Request, res: Response) {
    const { id } = req.params;
    await removeExceptionService(req.userId!, Number(id));
    sendSuccess(res, null, 200, "Availability exception deleted successfully");
}