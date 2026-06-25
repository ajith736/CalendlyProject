import {Router} from 'express';
import { findAllUsers, findById, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validtae.js';
import { createUserschema, updateUserSchema } from '../dtos/user.dto.js'



export const userRouter : Router = Router();
userRouter.get('/', findAllUsers);
userRouter.get('/:id', findById);
userRouter.post('/', validate(createUserschema), createUser);
userRouter.patch('/:id', validate(updateUserSchema), updateUser);
userRouter.delete('/:id', deleteUser);

