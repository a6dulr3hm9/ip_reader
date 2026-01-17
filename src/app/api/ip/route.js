import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

export async function GET(request) {
  // In a real deployment, we'd use X-Forwarded-For or similar headers.
  // For local development, it might be ::1, so we'll mock or fallback.

  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Determine if we should query specific IP or user's public IP (for localhost logic)
  const isLocal = ip === '::1' || ip === '127.0.0.1';
  // Request extended fields: items 66846719 = status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query
  const fields = '66846719';
  const apiUrl = isLocal
    ? `http://ip-api.com/json/?fields=${fields}`
    : `http://ip-api.com/json/${ip}?fields=${fields}`;

  // Parse User Agent
  const uaString = request.headers.get('user-agent') || '';
  const parser = new UAParser(uaString);
  const uaResult = parser.getResult();

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    // Normalize data to match our frontend expectation
    const geoData = {
      ip: data.query,
      city: data.city || 'Unknown',
      region: data.regionName || 'Unknown',
      country: data.country || 'Unknown',
      isp: data.isp || 'Unknown',
      org: data.org || 'Unknown',
      asn: data.as || 'Unknown',
      mobile: data.mobile ? 'Yes' : 'No',
      proxy: data.proxy ? 'Yes' : 'No',
      hosting: data.hosting ? 'Yes' : 'No',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || 'UTC',
      ua: {
        browser: `${uaResult.browser.name || 'Unknown'} ${uaResult.browser.version || ''}`,
        os: `${uaResult.os.name || 'Unknown'} ${uaResult.os.version || ''}`,
        device: `${uaResult.device.vendor || ''} ${uaResult.device.type || 'Desktop'} ${uaResult.device.model || ''}`,
        cpu: uaResult.cpu.architecture || 'Unknown'
      }
    };

    return NextResponse.json(geoData);
  } catch (error) {
    console.error('Geo fetch failed:', error);
    return NextResponse.json({
      ip: ip,
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      isp: "Unknown",
      lat: 0,
      lon: 0,
      timezone: "UTC",
      error: true
    }, { status: 500 });
  }
}
