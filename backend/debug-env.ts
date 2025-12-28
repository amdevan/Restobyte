
import 'dotenv/config';

console.log("--- Environment Verification ---");
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];

requiredVars.forEach(v => {
    const exists = !!process.env[v];
    const length = process.env[v]?.length || 0;
    console.log(`${v}: ${exists ? `EXISTS (length: ${length})` : 'MISSING'}`);

    if (v === 'DATABASE_URL' && exists) {
        try {
            const url = new URL(process.env[v]!);
            console.log(`  - Protocol: ${url.protocol}`);
            console.log(`  - Host: ${url.host}`);
            console.log(`  - DB: ${url.pathname}`);
        } catch (e) {
            console.log(`  - Error: Invalid URL format for ${v}`);
        }
    }
});

console.log("--------------------------------");
