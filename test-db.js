const { PrismaClient } = require('@prisma/client');



async function test() {
    console.log("--- Testing Connection ---");
    // Use existing DATABASE_URL from .env if available, fallback to sqlite for local tests
    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = 'file:./dev.db';
    }
    console.log("USING DATABASE_URL: ", process.env.DATABASE_URL);

    try {
        const p1 = new PrismaClient();
        console.log("Client created. Connecting...");
        await p1.$connect();
        console.log("✅ Success with empty constructor");
        await p1.$disconnect();
    } catch (e) {
        console.log("❌ Failed with empty constructor:", e.message);
    }
}

test();
