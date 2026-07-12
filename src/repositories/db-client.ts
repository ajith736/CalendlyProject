import { prisma } from "../config/database.js";

export type TransactionClient = Parameters<
    Parameters<typeof prisma.$transaction>[0]
>[0];

export type DbClient = typeof prisma | TransactionClient;

export function getDbClient(db?: DbClient): DbClient {
    // the parameter db is ur transaction object
    return db ?? prisma;
}
