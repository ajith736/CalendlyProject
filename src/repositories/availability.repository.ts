import { prisma } from "../config/database.js";
import {
    CreateAvailabilityExceptionDto,
    CreateAvailabilityRuleDto,
    UpdateAvailabilityExceptionDto,
    UpdateAvailabilityRuleDto,
} from "../dtos/availability.dto.js";

export async function findRulesByUser(userId: number) {
    return prisma.availabilityRule.findMany({
        where: { userId },
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
}

export async function findActiveRulesByUser(userId: number) {
    return prisma.availabilityRule.findMany({
        where: { userId, isActive: true },
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
}

export async function findRuleById(id: number) {
    return prisma.availabilityRule.findUnique({
        where: { id },
    });
}

export async function createRule(userId: number, data: CreateAvailabilityRuleDto) {
    return prisma.availabilityRule.create({
        data: {
            userId,
            ...data,
        },
    });
}

export async function updateRule(id: number, data: UpdateAvailabilityRuleDto) {
    return prisma.availabilityRule.update({
        where: { id },
        data,
    });
}

export async function removeRule(id: number) {
    await prisma.availabilityRule.delete({
        where: { id },
    });
}

export async function findExceptionsByUser(userId: number) {
    return prisma.availabilityException.findMany({
        where: { userId },
        orderBy: { date: "asc" },
    });
}

export async function findExceptionsById(id: number) {
    return prisma.availabilityException.findUnique({
        where: { id },
    });
}

export async function createException(userId: number, data: CreateAvailabilityExceptionDto) {
    const { date, ...rest } = data;
    return prisma.availabilityException.create({
        data: {
            userId,
            ...rest,
            date: new Date(`${date}T00:00:00.000Z`),
        },
    });
}

export async function updateException(id: number, data: UpdateAvailabilityExceptionDto) {
    const { date, ...rest } = data;
    return prisma.availabilityException.update({
        where: { id },
        data: {
            ...rest,
            ...(date !== undefined && { date: new Date(`${date}T00:00:00.000Z`) }),
        },
    });
}

export async function removeException(id: number) {
    await prisma.availabilityException.delete({
        where: { id },
    });
}

export async function findExceptionsByUserInRange(
    userId: number,
    startDate: Date,
    endDate: Date
) {
    return prisma.availabilityException.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: { date: "asc" },
    });
}