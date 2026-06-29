import { NextFunction, Request, Response } from 'express';
import { badRequest, unauthorized } from '../utils/api-error.js';

export function requireUserId(req: Request, _res: Response, next: NextFunction) {
    const userIdHeader = req.headers['x-user-id'];

    if (!userIdHeader || Array.isArray(userIdHeader) || typeof userIdHeader!=='string') {
        throw unauthorized('x-user-id header is required');
    }

    const userId = Number(userIdHeader);
    if (Number.isNaN(userId)) {
        throw badRequest('x-user-id must be a valid number');
    }

    req.userId = userId;
    next();
}
