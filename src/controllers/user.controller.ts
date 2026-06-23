import {Response, Request} from 'express';
import {findAllUsers as findAllUsersService,findById as findByIdService} from '../services/users.service.js';

export async function findAllUsers(_req:Request , res:Response){
    const response = await findAllUsersService();
    res.json(response);

}
export async function findById(req:Request , res:Response){
    const {id} = req.params;
    const response = await findByIdService(Number(id));
    res.json(response);
}

export async function createUser(req:Request , res:Response){
    console.log(req.body);
    res.json({});
}