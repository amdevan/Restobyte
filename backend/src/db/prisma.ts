import 'dotenv/config';
import PrismaModule from '@prisma/client';
const { PrismaClient } = PrismaModule;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("FATAL: DATABASE_URL is not defined in environment variables!");
    process.exit(1);
}

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['error'],
    datasourceUrl: dbUrl,
});

export default prisma;
