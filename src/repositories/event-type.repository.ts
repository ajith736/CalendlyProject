import { prisma } from "../config/database.js";
import { CreateEventTypeDto, UpdateEventTypeDto } from "../dtos/event-type.dto.js";

export async function findByHostId(hostId: number) {
    const eventTypes = await prisma.eventType.findMany({
        where: {
            hostId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    return eventTypes;
}

export async function getById(id: number) {
    const eventType = await prisma.eventType.findUnique({
        where: {
            id
        }
    });
    return eventType;
}
export async function create(hostId: number, data: CreateEventTypeDto & {slug:string}) {
    const eventType = await prisma.eventType.create({
        data: {
            hostId,
            ...data
        }
    });
    return eventType;
}

export async function update(id: number, data: UpdateEventTypeDto) {
    const eventType = await prisma.eventType.update({
        where: { id },
        data: data
    });
    return eventType;
}

export async function remove(id: number) {
    await prisma.eventType.delete({
        where: { id }
    });
}

export async function findByHostAndSlug(hostId: number, slug: string) {
    const eventType = await prisma.eventType.findFirst({
        where: {
            hostId,
            slug
        }
    });
    return eventType;
}
export async function findActiveByHostIdAndEventSlug(hostId: number, slug: string) {
    const eventType = await prisma.eventType.findFirst({
        where: {
            isActive: true,
            slug,
            hostId: hostId
        }
    });
    return eventType;

}

export async function slugExistsForHost(hostId: number, slug: string) {
    const existing = await prisma.eventType.findFirst({
        where: {
            hostId,
            slug
        }
    });
    return existing !==null;
}

export async function findActiveEventTypesByHost(hostId: number) {
    return prisma.eventType.findMany({
        where: {
            hostId,
            isActive: true,
        }
    })
}





