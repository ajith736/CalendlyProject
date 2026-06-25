import {Response, Request} from 'express';
import {findAllUsers as findAllUsersService,findById as findByIdService,createUser as createUserService} from '../services/users.service.js';
import { sendSuccess } from '../utils/api-response.js';

export async function findAllUsers(_req:Request , res:Response){
    const response = await findAllUsersService();
    sendSuccess(res,response);

}
export async function findById(req:Request , res:Response){
    const {id} = req.params;
    const response = await findByIdService(Number(id));
    sendSuccess(res,response);
}

export async function createUser(req:Request , res:Response){
    const data = req.body;
    const newUser = await createUserService(data);
    sendSuccess(res,newUser,201,'user craeted successfully');
}