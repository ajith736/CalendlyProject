import {Router} from 'express';
import { findAllUsers, findById, createUser } from '../controllers/user.controller.js';


export const userRouter : Router = Router();
userRouter.get('/', findAllUsers);
userRouter.get('/:id', findById);
userRouter.post('/', createUser);

