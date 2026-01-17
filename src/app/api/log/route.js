import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function getPlatform(referrer) {
    if (!referrer) return 'Direct / Link Share';
    const ref = referrer.toLowerCase();
    if (ref.includes('whatsapp')) return 'WhatsApp';
    if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) return 'X / Twitter';
    if (ref.includes('facebook') || ref.includes('fb.me')) return 'Facebook';
    if (ref.includes('instagram')) return 'Instagram';
    if (ref.includes('t.me') || ref.includes('telegram')) return 'Telegram';
    if (ref.includes('linkedin')) return 'LinkedIn';
    return 'Referral / Other';
}

export async function POST(request) {
    try {
        const body = await request.json();
        const referrer = request.headers.get('referer') || '';
        const platform = getPlatform(referrer);

        const {
            systemId,
            ip, isp, org, asn, mobile, proxy, hosting,
            city, region, country, lat, lon, timezone,
            browser, os, cpuArch, deviceType,
            connectionType,
            linkId,
            visitorEmail,
            updateOnly
        } = body;

        let log;

        if (updateOnly && systemId) {
            // Update existing log with email
            const existingLog = await prisma.visitorLog.findFirst({
                where: { systemId, linkId },
                orderBy: { createdAt: 'desc' }
            });

            if (existingLog) {
                log = await prisma.visitorLog.update({
                    where: { id: existingLog.id },
                    data: { visitorEmail: visitorEmail || null },
                    include: { link: true }
                });
            } else {
                return NextResponse.json({ success: false, error: 'Log not found' }, { status: 404 });
            }
        } else {
            // Create new log entry
            log = await prisma.visitorLog.create({
                data: {
                    systemId,
                    ip, isp, org, asn, mobile, proxy, hosting,
                    city, region, country, lat, lon, timezone,
                    browser, os, cpuArch, deviceType,
                    connectionType,
                    linkId: linkId || null,
                    platform,
                    visitorEmail: visitorEmail || null
                },
                include: {
                    link: true
                }
            });
        }

        // Trigger Email Notification (REFINED PRIVACY)
        // We ONLY notify the sender when a lead is captured (identity unlocked)
        // Or if it's a direct visit NOT via a tracking link (standard report)
        const shouldNotify = updateOnly || !log.linkId;

        if (shouldNotify && log.link?.senderEmail && (resend || process.env.NODE_ENV === 'development')) {
            const subject = updateOnly ? '👤 Identity Unlocked: New Lead!' : '🚨 New Forensic Visitor';
            const html = `
                <h2>${updateOnly ? 'Lead Identity Captured!' : 'New Target Identified!'}</h2>
                <p>Someone just ${updateOnly ? 'verified their identity' : 'accessed the portal'} via <b>${platform}</b>.</p>
                <hr/>
                <ul>
                    <li><b>IP:</b> ${log.ip}</li>
                    <li><b>Location:</b> ${log.city}, ${log.region}, ${log.country}</li>
                    ${log.visitorEmail ? `<li style="color: #00ff9d; font-size: 1.2rem;"><b>Captured Email:</b> ${log.visitorEmail}</li>` : '<li style="color: #ff4d4d;"><b>Identity:</b> Locked (Awaiting lead capture)</li>'}
                    <li><b>ISP:</b> ${log.isp}</li>
                    <li><b>Platform:</b> ${platform}</li>
                    <li><b>Device:</b> ${log.os} (${log.browser})</li>
                </ul>
                <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin">View Dashboard for Full Details</a></p>
            `;

            if (resend) {
                try {
                    await resend.emails.send({
                        from: 'IP Profiler <notifications@resend.dev>',
                        to: log.link.senderEmail,
                        subject: subject,
                        html: html
                    });
                } catch (emailErr) {
                    console.error('Failed to send email:', emailErr);
                }
            } else {
                console.log('--- EMAIL SIMULATION ---');
                console.log('TO:', log.link.senderEmail);
                console.log('SUBJECT:', subject);
            }
        }

        return NextResponse.json({ success: true, id: log.id });
    } catch (error) {
        console.error('Logging failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to log data' }, { status: 500 });
    }
}
