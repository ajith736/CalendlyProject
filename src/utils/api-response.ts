import {Response} from 'express';

interface SuccessPayLoad<T>{    // this is like a blueprint of how a response should look like
    success:true;               //It is just describing the expected structure
    data:T;
    message?:string;
}

export function sendSuccess<T>(res:Response,data:T,statusCode=200,message?:string):void{
    const body:SuccessPayLoad<T>={
        success:true,
        data
    };
    if(message) body.message=message;
    res.status(statusCode).json(body);
} 