import {getAll} from '../repositories/user.repository.js';

export async function findAllUsers(){
    const users = await getAll();
    return users;
}