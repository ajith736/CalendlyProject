import {getAll} from '../repositories/user.repository.js';
import {getById} from '../repositories/user.repository.js';

export async function findAllUsers(){
    const users = await getAll();
    return users;
}

export async function findById(id:number){
    const user = await getById(id);
    if(!user){
        throw new Error('User not found');
    }
    return user;
}
