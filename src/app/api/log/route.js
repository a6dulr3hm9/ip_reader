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
            visitorPhone,
            platformUser
        } = body;

        const log = await prisma.visitorLog.create({
            data: {
                systemId,
                ip, isp, org, asn, mobile, proxy, hosting,
                city, region, country, lat, lon, timezone,
                browser, os, cpuArch, deviceType,
                connectionType,
                linkId: linkId || null,
                platform,
                visitorEmail: visitorEmail || null,
                visitorPhone: visitorPhone || null,
                platformUser: platformUser || null
            },
            include: {
                link: true
            }
        });

        // Trigger Email Notification if linkId exists and sender email is available
        if (log.link?.senderEmail && resend) {
            try {
                await resend.emails.send({
                    from: 'IP Profiler <notifications@resend.dev>', // Use a verified domain in production
                    to: log.link.senderEmail,
                    subject: '🚨 New Visitor on your Tracking Link!',
                    html: `
                        <h2>New Target Identified!</h2>
                        <p>Someone just opened your shared link via <b>${platform}</b>.</p>
                        <hr/>
                        <ul>
                            <li><b>IP:</b> ${ip}</li>
                            <li><b>Location:</b> ${city}, ${region}, ${country}</li>
                            <li><b>ISP:</b> ${isp}</li>
                            <li><b>Platform:</b> ${platform}</li>
                            ${visitorEmail ? `<li><b>Visitor Email:</b> ${visitorEmail}</li>` : ''}
                            <li><b>Device:</b> ${os} (${browser})</li>
                        </ul>
                        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/report/${log.id}">View Full Forensic Report</a></p>
                    `
                });
                console.log('Email sent to:', log.link.senderEmail);
            } catch (emailErr) {
                console.error('Failed to send email:', emailErr);
            }
        } else if (log.link?.senderEmail) {
            console.log('--- EMAIL NOTIFICATION (SIMULATED) ---');
            console.log('TO:', log.link.senderEmail);
            console.log('SUBJECT: New Visitor via', platform);
            console.log('DATA:', { ip, city, platform });
        }

        return NextResponse.json({ success: true, id: log.id });
    } catch (error) {
        console.error('Logging failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to log data' }, { status: 500 });
    }
}
