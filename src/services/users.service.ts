import { CreateuserDto } from '../dtos/user.dto.js';
import {create, findByEmail, getAll} from '../repositories/user.repository.js';
import {getById} from '../repositories/user.repository.js';
import { conflict, notFound } from '../utils/api-error.js';

export async function findAllUsers(){
    const users = await getAll();
    return users;
}

export async function findById(id:number){
    const user = await getById(id);
    if(!user){
        throw notFound('User not found');
    }
    return user;
}

export async function createUser(data:CreateuserDto){
    const checkUserExists = await findByEmail(data.email);
    if(checkUserExists){
        throw conflict('User alreay exists');
    }
    return create(data);
}
