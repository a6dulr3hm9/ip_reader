const { PrismaClient } = require('@prisma/client');



async function test() {
    console.log("--- Testing EMPTY constructor ---");
    // Ensure ENV is set
    process.env.DATABASE_URL = 'file:./dev.db';
    console.log("ENV SET: ", process.env.DATABASE_URL);

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
