"use client";

import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemId, setSystemId] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState('');
  const [linkId, setLinkId] = useState(null);
  const [isBlurred, setIsBlurred] = useState(true);

  useEffect(() => {
    // Generate System ID once on mount
    setSystemId(Math.random().toString(36).substring(7).toUpperCase());

    // Check for link tracking ID in URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    if (sid) {
      setLinkId(sid);
      setIsBlurred(true); // Ensure blurred for tracking links
    } else {
      setIsBlurred(false); // No blur for original direct visits
    }

    // ANTI-INSPECT SECURITY
    const disableInspect = (e) => {
      // Disable Right Click
      if (e.type === 'contextmenu') e.preventDefault();

      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (e.type === 'keydown') {
        if (
          e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // Ctrl+Shift+I/J
          (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) // Ctrl+U/S
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    document.addEventListener('contextmenu', disableInspect);
    document.addEventListener('keydown', disableInspect);

    return () => {
      document.removeEventListener('contextmenu', disableInspect);
      document.removeEventListener('keydown', disableInspect);
    };
  }, []);

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: senderEmail || 'free-share@anonymous.com' }),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedLink(json.url);
      }
    } catch (err) {
      console.error('Failed to generate link', err);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    // Only fetch data once, validation via check
    if (!systemId) return;

    const getClientData = async () => {
      const nav = window.navigator;
      const screen = window.screen;

      // GPU & Battery & Storage logic
      // GPU
      let gpu = 'Unknown';
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      } catch (e) { console.warn('WebGL not supported'); }

      // Battery
      let batteryInfo = 'Unknown';
      if (nav.getBattery) {
        try {
          const battery = await nav.getBattery();
          batteryInfo = `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})`;
        } catch (e) { }
      }

      // Storage
      let storageInfo = 'Unknown';
      if (nav.storage && nav.storage.estimate) {
        try {
          const estimate = await nav.storage.estimate();
          const quota = estimate.quota ? (estimate.quota / 1024 / 1024 / 1024).toFixed(1) + ' GB' : 'Unknown';
          storageInfo = `${quota} Quota`;
        } catch (e) { }
      }

      return {
        screen: `${screen.width}x${screen.height} (${screen.colorDepth}-bit)`,
        pixelRatio: window.devicePixelRatio || 1,
        cores: nav.hardwareConcurrency || 'Unknown',
        memory: nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'Unknown',
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        connection: nav.connection ? `${nav.connection.effectiveType} (${nav.connection.rtt}ms)` : 'Unknown',
        gpu: gpu,
        battery: batteryInfo,
        storage: storageInfo,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookies: nav.cookieEnabled ? 'Enabled' : 'Disabled',
        doNotTrack: nav.doNotTrack || 'Unknown',
        historyLength: window.history.length
      };
    };

    const run = async () => {
      const cData = await getClientData();
      setClientData(cData);

      try {
        await new Promise(r => setTimeout(r, 1000));

        // Parallel Fetch: Main IP (Server) + IPv4 Force (Client)
        const [res, resIPv4] = await Promise.all([
          fetch('/api/ip'),
          fetch('https://api.ipify.org?format=json').catch(() => null)
        ]);

        const json = await res.json();
        const jsonIPv4 = resIPv4 ? await resIPv4.json() : null;

        // Merge IPv4 if detected
        if (jsonIPv4 && jsonIPv4.ip) {
          json.ipv4 = jsonIPv4.ip;
        }

        setData(json);

        // Logging Logic (Fire and Forget)
        const logPayload = {
          systemId: systemId,
          ip: json.ip,
          ipv4_fallback: json.ipv4 || 'N/A',
          isp: json.isp,
          org: json.org,
          asn: json.asn,
          mobile: json.mobile,
          proxy: json.proxy,
          hosting: json.hosting,
          city: json.city,
          region: json.region,
          country: json.country,
          lat: json.lat,
          lon: json.lon,
          timezone: json.timezone,
          browser: json.ua?.browser,
          os: json.ua?.os,
          cpuArch: json.ua?.cpu,
          deviceType: json.ua?.device,
          connectionType: cData.connection,
          linkId: linkId,
          visitorEmail: visitorEmail // This will be updated if they fill the form later
        };

        console.log('Logging visit...', logPayload);
        fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logPayload)
        }).catch(err => console.error('Logging failed', err));

      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    run();
  }, [systemId, linkId]); // Re-run if linkId changes (unlikely once set)

  const handleVisitorLead = async (e) => {
    e.preventDefault();
    if (!visitorEmail) return;
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId,
          linkId,
          visitorEmail,
          updateOnly: true
        })
      });
      setIsBlurred(false);
      alert('Identity Disclosed. Forensic data unlocked.');
    } catch (err) { }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🚨 IP PROFILER REPORT: Check this forensic system analysis: ${generatedLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareX = () => {
    const text = encodeURIComponent(`🚨 Forensic System Analysis Active. View Report: ${generatedLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <main className="container">
      <div className="glass-panel relative" style={{ maxWidth: '800px' }}>
        <div className="scan-line"></div>

        <h1 className="title">IP Profiler <span style={{ fontSize: '1rem', verticalAlign: 'middle', background: 'var(--primary)', color: 'black', padding: '2px 8px', borderRadius: '4px' }}>MAX</span></h1>

        {loading ? (
          <div>
            <div className="loader"></div>
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-geist-mono)', color: '#888' }}>
              EXTRACTING DEEP SYSTEM METRICS...
            </p>
          </div>
        ) : (
          <div className="content">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="label">Observed IP Address</span>
              <div className="ip-text">
                {data?.ip || 'UNKNOWN'}
              </div>

              {/* IPv4 Display Logic */}
              {data?.ipv4 && data?.ipv4 !== data?.ip && (
                <div style={{ fontSize: '1rem', fontFamily: 'var(--font-geist-mono)', color: '#00ff9d', marginTop: '0.2rem' }}>
                  IPv4: {data?.ipv4}
                </div>
              )}

              <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {data?.org || data?.isp} (AS{data?.asn})
              </div>
            </div>

            <div className="relative">
              {isBlurred && (
                <div className="identification-overlay">
                  <div className="lock-icon">🔒</div>
                  <h3>IDENTITY VERIFICATION REQUIRED</h3>
                  <p>This diagnostic report is encrypted. Enter your email to authorize access and notify the secure sender.</p>

                  <form onSubmit={handleVisitorLead} className="overlay-form">
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      required
                      className="share-input"
                    />
                    <button type="submit" className="share-button">UNLOCK METRICS</button>
                  </form>

                  <div style={{ marginTop: '20px', fontSize: '0.7rem', color: '#666' }}>
                    * By unlocking, your IP: {data?.ip} and forensics will be shared with the link creator.
                  </div>
                </div>
              )}

              <div className={`blurred-container ${isBlurred ? 'blurred' : ''}`}>
                {/* SEGMENT 1: NETWORK */}
                <div className="section-title">Network Intelligence</div>
                <div className="data-grid">
                  <div className="data-item">
                    <div className="label">ISP</div>
                    <div className="value">{data?.isp}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Organization</div>
                    <div className="value">{data?.org}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Connectivity</div>
                    <div className="value" style={{ fontSize: '0.9rem' }}>
                      {data?.mobile === 'Yes' ? 'Mobile Data' : 'Broadband'}
                      {data?.proxy === 'Yes' ? ' (Proxy/VPN)' : ''}
                      {data?.hosting === 'Yes' ? ' (Hosting)' : ''}
                    </div>
                  </div>
                  <div className="data-item">
                    <div className="label">Client Connection</div>
                    <div className="value">{clientData?.connection}</div>
                  </div>
                </div>

                {/* SEGMENT 2: GEOLOCATION */}
                <div className="section-title">Geolocation</div>
                <div className="data-grid">
                  <div className="data-item">
                    <div className="label">Location</div>
                    <div className="value">{data?.city}, {data?.region}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Country</div>
                    <div className="value">{data?.country}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Coordinates</div>
                    <div className="value">{data?.lat}, {data?.lon}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Timezone</div>
                    <div className="value">{clientData?.timezone}</div>
                  </div>
                </div>

                {/* SEGMENT 3: HARDWARE IDENTITY */}
                <div className="section-title">Hardware Identity</div>
                <div className="data-grid">
                  <div className="data-item">
                    <div className="label">Platform</div>
                    <div className="value">{data?.ua?.os} / {data?.ua?.cpu}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">CPU Cores</div>
                    <div className="value">{clientData?.cores} Logical Cores</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Memory (RAM)</div>
                    <div className="value">{clientData?.memory}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">GPU Renderer</div>
                    <div className="value" style={{ fontSize: '0.8rem' }}>{clientData?.gpu}</div>
                  </div>
                </div>

                {/* SEGMENT 4: BROWSER & ENVIRONMENT */}
                <div className="section-title">Environment & Security</div>
                <div className="data-grid">
                  <div className="data-item">
                    <div className="label">Browser</div>
                    <div className="value">{data?.ua?.browser}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Screen</div>
                    <div className="value">{clientData?.screen} @ {clientData?.pixelRatio}x</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Battery Status</div>
                    <div className="value">{clientData?.battery}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Storage Quota</div>
                    <div className="value">{clientData?.storage}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Tracking Protection</div>
                    <div className="value">{clientData?.doNotTrack === '1' ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div className="data-item">
                    <div className="label">Cookies</div>
                    <div className="value" style={{ color: clientData?.cookies === 'Enabled' ? '#00ff9d' : '#ff4d4d' }}>{clientData?.cookies}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


              {/* SEGMENT 5: BROADCAST INTELLIGENCE (SHARE) */}
        <div className="section-title">Broadcast Intelligence (Share)</div>
        <div className="share-section">
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
            Generate a masked tracking link and share it directly to social platforms.
          </p>
          {!generatedLink ? (
            <form onSubmit={handleGenerateLink} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                placeholder="Alert destination (optional)"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="share-input"
              />
              <button type="submit" className="share-button" disabled={isGenerating}>
                {isGenerating ? 'LOCKING...' : 'GENERATE TRACKING LINK'}
              </button>
            </form>
          ) : (
            <div className="generated-link-box" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '10px' }}>BROADCAST LINK ACTIVE:</div>

              <div className="social-share-group">
                <button onClick={shareWhatsApp} className="social-button whatsapp">
                  Share to WhatsApp
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert('Link copied! Share it on Instagram DM.');
                }} className="social-button instagram">
                  Share to Instagram
                </button>
                <button onClick={shareX} className="social-button x">
                  Share to X
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert('Copied to clipboard!');
                }} className="social-button copy">
                  Copy Link
                </button>
              </div>

              <p style={{ fontSize: '0.65rem', color: '#555', marginTop: '12px' }}>
                Tracking is active. Alerts are locked until visitor consent.
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: '#444', borderTop: '1px solid #222', paddingTop: '1rem' }}>
          SYSTEM ID: {systemId} | {linkId ? `TRACKING ACTIVE: ${linkId}` : 'SESSION: ENCRYPTED'}
        </div>
      </div>
        )}
    </div>
    </main >
  );
}
