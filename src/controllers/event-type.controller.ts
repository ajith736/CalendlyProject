import { Request, Response } from 'express';
import {
    listEventTypes as listEventTypesService,
    getEventTypeById as getEventTypeByIdService,
    createEventType as createEventTypeService,
    updateEventType as updateEventTypeService,
    removeEventType as removeEventTypeService,
    getEventTypePublic as getEventTypePublicService,
} from '../services/event-types.service.js';
import { sendSuccess } from '../utils/api-response.js';

export async function listEventTypes(req: Request, res: Response) {
    const response = await listEventTypesService(req.userId!);
    sendSuccess(res, response);
}

export async function getEventTypeById(req: Request, res: Response) {
    const { id } = req.params;
    const response = await getEventTypeByIdService(Number(id), req.userId!);
    sendSuccess(res, response);
}

export async function createEventType(req: Request, res: Response) {
    const data = req.body;
    const response = await createEventTypeService(req.userId!, data);
    sendSuccess(res, response, 201, 'Event type created successfully');
}

export async function updateEventType(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    const response = await updateEventTypeService(req.userId!, Number(id), data);
    sendSuccess(res, response, 200, 'Event type updated successfully');
}

export async function removeEventType(req: Request, res: Response) {
    const { id } = req.params;
    await removeEventTypeService(req.userId!, Number(id));
    sendSuccess(res, null, 200, 'Event type removed successfully');
}

export async function getPublicEventType(req: Request, res: Response) {
    const { userId, slug } = req.params;
    const response = await getEventTypePublicService(Number(userId), String(slug));
    sendSuccess(res, response);
}
