const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const user = await prisma.adminUser.upsert({
        where: { username },
        update: { password },
        create: {
            username,
            password,
        },
    });

    console.log(`Admin user ${user.username} created/updated.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
