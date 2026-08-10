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

// Helper: check if error is a transient connection error
function isConnectionError(error: any): boolean {
    return (
        error?.code === 'P1001' ||
        error?.code === 'P1002' ||
        error?.code === 'P2021' ||
        error?.code === 'P2022' ||
        String(error?.message || '').includes('terminating connection') ||
        String(error?.message || '').includes('connection refused') ||
        String(error?.message || '').includes('ECONNREFUSED') ||
        String(error?.message || '').includes('Connection terminated')
    );
}

// Wrap database calls with retry logic for transient connection errors
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (!isConnectionError(error) || attempt === maxRetries) {
                throw error;
            }
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.warn(`[db] Retry ${attempt}/${maxRetries} after ${delay}ms: ${String(error.message || '').slice(0, 100)}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

export default prisma;
