import { prisma } from "../config/database.js";
import {CreateuserDto} from "../dtos/user.dto.js"


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

export async function findByEmail(email:string){
    const user = await prisma.user.findUnique({
        where:{
            email       
         }
    })
    return user;
}

export async function create(data:CreateuserDto){  // here CreateuserDto is the type of the user craetion data.
    const user = await prisma.user.create({        // we have defined the type of the data for user raetion in dto's folder and using it directly here
        data
    });
    return user;
}