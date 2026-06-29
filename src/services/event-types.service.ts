import slug from "slug";
import { CreateEventTypeDto, UpdateEventTypeDto } from "../dtos/event-type.dto.js";
import { create, findActiveByHostIdAndEventSlug, findByHostId, getById, remove, slugExistsForHost, update } from "../repositories/event-type.repository.js";
import { conflict, forbidden, notFound } from "../utils/api-error.js";
import { getById as getUserById } from "../repositories/user.repository.js";


export async function listEventTypes(hostId: number) {
    const eventTypes = await findByHostId(hostId);
    return eventTypes;
}

export async function createEventType(hostId: number, data: CreateEventTypeDto) {
    const slugPassed = data.slug ?? slug(data.title, { lower: true });

    if(!slugPassed) {
        throw conflict('Could not generate a slug for the event type');
    }

    const isSlugTaken = await slugExistsForHost(hostId, slugPassed);
    if(isSlugTaken) {
        throw conflict('A event type with this slug already exists, please use a different slug');
    }

    return create(hostId, {...data, slug: slugPassed});
}

export async function updateEventType(hostId: number, id: number, data: UpdateEventTypeDto) {
    const eventType = await getById(id);
    if(!eventType) {
        throw notFound('Event type not found');
    }
    if(eventType.hostId !== hostId) {
        throw forbidden('You are not authorized to update this event type');
    }

    if(data.slug && data.slug !== eventType.slug) {
        const isSlugTaken = await slugExistsForHost(hostId, data.slug);
        if(isSlugTaken) {
            throw conflict('A event type with this slug already exists, please use a different slug');
        }
    }

    return update(id, data);
}

export async function removeEventType(hostId: number, id: number) {
    const eventType = await getById(id);
    if(!eventType) {
        throw notFound('Event type not found');
    }
    if(eventType.hostId !== hostId) {
        throw forbidden('You are not authorized to delete this event type');
    }
    return remove(id);
}

export async function getEventTypeById(id: number, hostId: number) {
    const eventType = await getById(id);
    if(!eventType) {
        throw notFound('Event type not found');
    }
    if(eventType.hostId !== hostId) {
        throw forbidden('You are not authorized to view this event type');
    }
    return eventType;
}

export async function getEventTypePublic(hostId: number, eventSlug: string) {
    const eventType = await findActiveByHostIdAndEventSlug(hostId, eventSlug);

    if(!eventType) {
        throw notFound('Event type not found');
    }

    const host = await getUserById(hostId);
    if(!host) {
        throw notFound('Host not found');
    }
    
    return {
        eventType: {
            id: eventType.id,
            title: eventType.title,
            description: eventType.description,
            durationMinutes: eventType.durationMinutes,
            locationType: eventType.locationType,
        },
        host: {
            name: host.name,
            email: host.email,
        }
    }
}