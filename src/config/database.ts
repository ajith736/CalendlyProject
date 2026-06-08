import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from './env.js';

const adapter = new PrismaPg({
    connectionString: DATABASE_URL
});

export const prisma = new PrismaClient({
    adapter
});

export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
}

