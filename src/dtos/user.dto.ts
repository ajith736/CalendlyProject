import { z } from 'zod';

export const createUserschema = z.object({
    email : z.email('Invalid email address'),
    name : z.string().min(1,'Name is required').max(100,'Name must be less than 100 characters'),
    slug:z.string().min(1).max(100).optional()
});

export type CreateuserDto = z.infer<typeof createUserschema>;

export const updateUserSchema = z.object({
    email: z.email('Invalid email address').optional(),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional()
}).refine((data) => data.email !== undefined || data.name !== undefined, {
    message: 'At least one field must be provided'
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

