  import {z} from "zod";

  export const createEventTypeSchema = z.object({
    title : z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    durationMinutes:z.number().min(15).max(120).default(30),
    isActive:z.boolean().default(true),
    locationType:z.enum(['online','in-person']).default('online'),
    locationValue:z.string().optional(),
    bufferBeforeMinutes:z.number().min(0).max(120).default(0),
    bufferAfterMinutes:z.number().min(0).max(120).default(0),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens').optional(),
  });
  export const UpdateEventTypeSchema = createEventTypeSchema.partial(); // this schema is like a subset of the original schema
  export type CreateEventTypeDto = z.infer<typeof createEventTypeSchema>;
  export type UpdateEventTypeDto = z.infer<typeof UpdateEventTypeSchema>;


