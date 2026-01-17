import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
        }

        const sharedLink = await prisma.sharedLink.create({
            data: {
                senderEmail: email,
            },
        });

        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

        return NextResponse.json({
            success: true,
            linkId: sharedLink.id,
            url: `${baseUrl}/?sid=${sharedLink.id}`
        });

    } catch (error) {
        console.error('Link generation failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to create sharing link' }, { status: 500 });
    }
}
