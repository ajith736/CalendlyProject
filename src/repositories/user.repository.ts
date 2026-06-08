import { prisma } from "../config/database.js";

export async function getAll(){
    const users = await prisma.user.findMany();
    return users;

}

export async function getById(id:number){
    const user = await prisma.user.findUnique({
        where:{
            id
        }
    });
    return user;
}