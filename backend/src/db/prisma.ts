import 'dotenv/config';
import { PrismaClient } from '@prisma/client';




const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("FATAL: DATABASE_URL is not defined in environment variables!");
} else {
    // Log a masked version of the URL for debugging without exposing credentials
    try {
        const url = new URL(dbUrl);
        console.log(`DEBUG: DATABASE_URL protocol=${url.protocol}, host=${url.host}, db=${url.pathname}`);
    } catch (e) {
        console.error("DEBUG: DATABASE_URL is not a valid URL format!");
    }
}

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

export default prisma;
