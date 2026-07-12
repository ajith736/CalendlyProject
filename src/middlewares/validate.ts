import { NextFunction,Response,Request } from "express";
import { ZodSchema } from "zod";
import { badRequest } from "../utils/api-error.js";

// validate is custom validation function which will spit-out new middlewares 

export const validate = (schema:ZodSchema)=>(req:Request,_res:Response,next:NextFunction)=>{
    const result = schema.safeParse(req.body);

    if(!result.success){
        throw badRequest('validation failed',result.error.issues);
    }

    // if validation passes
    req.body = result.data;
    next();  // calling controller with the validated data
}

export const validateQuery = (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            throw badRequest('Validation failed', result.error.issues);
        }

        req.query = result.data as Request['query'];
        next();
    };