import {
    CreateAvailabilityExceptionDto,
    CreateAvailabilityRuleDto,
    UpdateAvailabilityExceptionDto,
    UpdateAvailabilityRuleDto,
} from "../dtos/availability.dto.js";
import {
    createException as createExceptionRepo,
    createRule as createRuleRepo,
    findExceptionsById,
    findExceptionsByUser,
    findRuleById,
    findRulesByUser,
    removeException as removeExceptionRepo,
    removeRule as removeRuleRepo,
    updateException as updateExceptionRepo,
    updateRule as updateRuleRepo,
} from "../repositories/availability.repository.js";
import { startRegenerateHostWorkflow } from "../temporal/client.js";
import { forbidden, notFound } from "../utils/api-error.js";

export async function listRules(userId: number) {
    return findRulesByUser(userId);
}

export async function createRule(userId: number, data: CreateAvailabilityRuleDto) {
    const createdRule = await createRuleRepo(userId, data);
    await startRegenerateHostWorkflow({hostId:userId}); 
    return createdRule;
}

export async function updateRule(userId: number, ruleId: number, data: UpdateAvailabilityRuleDto) {
    const rule = await findRuleById(ruleId);
    if (!rule) {
        throw notFound("Availability rule not found");
    }
    if (rule.userId !== userId) {
        throw forbidden("You are not authorized to update this availability rule");
    }

    const updatedRule = await updateRuleRepo(ruleId, data);
    await startRegenerateHostWorkflow({hostId:userId}); 
    return updatedRule;
    
}

export async function removeRule(userId: number, ruleId: number) {
    const rule = await findRuleById(ruleId);
    if (!rule) {
        throw notFound("Availability rule not found");
    }
    if (rule.userId !== userId) {
        throw forbidden("You are not authorized to delete this availability rule");
    }

    const removedRule = await removeRuleRepo(ruleId);
    await startRegenerateHostWorkflow({hostId:userId}); 
    return removedRule;
}

export async function listExceptions(userId: number) {
    return findExceptionsByUser(userId);
}

export async function createException(userId: number, data: CreateAvailabilityExceptionDto) {
    const createdException = await createExceptionRepo(userId, data);
    await startRegenerateHostWorkflow({hostId:userId}); 
    return createdException;
}

export async function updateException(userId: number, exceptionId: number, data: UpdateAvailabilityExceptionDto) {
    const exception = await findExceptionsById(exceptionId);
    if (!exception) {
        throw notFound("Availability exception not found");
    }
    if (exception.userId !== userId) {
        throw forbidden("You are not authorized to update this availability exception");
    }

    const updatedException = updateExceptionRepo(exceptionId, data);
    await startRegenerateHostWorkflow({hostId:userId}); 
    return updatedException;

}

export async function removeException(userId: number, exceptionId: number) {
    const exception = await findExceptionsById(exceptionId);
    if (!exception) {
        throw notFound("Availability exception not found");
    }
    if (exception.userId !== userId) {
        throw forbidden("You are not authorized to delete this availability exception");
    }

    const removedException = await removeExceptionRepo(exceptionId);
    await startRegenerateHostWorkflow({hostId:userId});
    return removedException;

}