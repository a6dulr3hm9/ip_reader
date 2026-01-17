import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const body = await request.json();

        // Explicitly destructure allowed fields to prevent arbitrary data insertion
        // and ensuring forbidden fields (battery, storage, gpu, etc.) are NOT passed.
        const {
            systemId,
            ip, isp, org, asn, mobile, proxy, hosting,
            city, region, country, lat, lon, timezone,
            browser, os, cpuArch, deviceType,
            connectionType
        } = body;

        const log = await prisma.visitorLog.create({
            data: {
                systemId,
                ip, isp, org, asn, mobile, proxy, hosting,
                city, region, country, lat, lon, timezone,
                browser, os, cpuArch, deviceType,
                connectionType
            },
        });

        return NextResponse.json({ success: true, id: log.id });
    } catch (error) {
        console.error('Logging failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to log data' }, { status: 500 });
    }
}
