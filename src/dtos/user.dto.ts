import { z } from 'zod';

export const createUserschema = z.object({
    email : z.email('Invalid email address'),
    name : z.string().min(1,'Name is required').max(100,'Name must be less than 100 characters')
});

export type CreateuserDto = z.infer<typeof createUserschema>;

