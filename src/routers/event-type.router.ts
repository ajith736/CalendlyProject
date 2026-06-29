import { Router } from 'express';
import {
    listEventTypes,
    getEventTypeById,
    createEventType,
    updateEventType,
    removeEventType,
} from '../controllers/event-type.controller.js';
import { validate } from '../middlewares/validtae.js';
import { requireUserId } from '../middlewares/require-user-id.js';
import { createEventTypeSchema, UpdateEventTypeSchema } from '../dtos/event-type.dto.js';

export const eventTypeRouter = Router();

eventTypeRouter.use(requireUserId);
eventTypeRouter.get('/', listEventTypes);
eventTypeRouter.get('/:id', getEventTypeById);
eventTypeRouter.post('/', validate(createEventTypeSchema), createEventType);
eventTypeRouter.patch('/:id', validate(UpdateEventTypeSchema), updateEventType);
eventTypeRouter.delete('/:id', removeEventType);
