import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

// Link previews need the full web address. Set NEXT_PUBLIC_SITE_URL once the site has a domain;
// on Vercel the project's address is picked up automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

const title = 'Adyssey | G.L. Aditya Vardhan, Graphic Designer & Creative Editor';
const description =
  'Graphic designer and creative editor in Hyderabad, India: social media creatives, ad banners, product and model retouching, reels and AI content.';
const ogImage = { url: '/og-image-1200x630.png', width: 1200, height: 630, alt: 'Adyssey logo' };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Adyssey',
  // Icons and manifest from the Adyssey logo kit (brand/ADYSSEY_Logo_Website_Kit/04_Favicon)
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: { type: 'website', siteName: 'Adyssey', title, description, images: [ogImage] },
  twitter: { card: 'summary_large_image', title, description, images: [ogImage.url] },
};

export const viewport: Viewport = {
  themeColor: '#0B0A0F',
};

// Before first paint: apply the saved theme, and skip the intro when coming back through a door.
const bootScript = `try{var d=document.documentElement,t=localStorage.getItem('theme');if(t)d.dataset.theme=t;if(sessionStorage.getItem('returnDoor'))d.dataset.intro='seen'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="bg-bg font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
