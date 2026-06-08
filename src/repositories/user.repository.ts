import { prisma } from "../config/database.js";

export async function getAll(){
    const users = await prisma.user.findMany();
    return users;

}