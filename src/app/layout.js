import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "IP Profiler MAX | Advanced Network & Device Fingerprinting",
  description: "Analyze your digital footprint. Detect IP address, geolocation (City, ASN, ISP), and advanced browser fingerprinting (Battery, GPU, Storage) instantly.",
  keywords: ["IP Scanner", "Geolocation", "Browser Fingerprint", "VPN Detector", "Network Tools", "Device Info", "IP Address Lookup"],
  openGraph: {
    title: "IP Profiler MAX",
    description: "Reveal your complete digital identity. IP, Location, ISP, and Hardware analysis.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
