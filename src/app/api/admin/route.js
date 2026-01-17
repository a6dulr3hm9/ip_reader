import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, username, password, query, newUser, newPass } = body;

        // 1. Authentication Check
        if (action === 'login') {
            const admin = await prisma.adminUser.findFirst({
                where: { username, password }
            });
            if (admin) return NextResponse.json({ success: true });
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        // 2. Fetch Data (Requires simple logic/shared secret if not using proper sessions)
        // For this demo, we'll check credentials on every restricted action
        const admin = await prisma.adminUser.findFirst({
            where: { username, password }
        });
        if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

        if (action === 'list') {
            const logs = await prisma.visitorLog.findMany({
                orderBy: { createdAt: 'desc' },
                include: { link: true }
            });
            return NextResponse.json({ success: true, logs });
        }

        if (action === 'search') {
            const logs = await prisma.visitorLog.findMany({
                where: {
                    OR: [
                        { ip: { contains: query, mode: 'insensitive' } },
                        { city: { contains: query, mode: 'insensitive' } },
                        { country: { contains: query, mode: 'insensitive' } },
                        { visitorEmail: { contains: query, mode: 'insensitive' } },
                        { visitorPhone: { contains: query, mode: 'insensitive' } }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                include: { link: true }
            });
            return NextResponse.json({ success: true, logs });
        }

        if (action === 'addUser') {
            if (!newUser || !newPass) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
            await prisma.adminUser.create({
                data: { username: newUser, password: newPass }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Admin API error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
