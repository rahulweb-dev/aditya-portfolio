import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Space_Mono, Water_Brush } from 'next/font/google';
import Grain from '@/components/Grain';
import CursorTrail from '@/components/CursorTrail';
import ModeTransition from '@/components/ModeTransition';
import SmoothScroll from '@/components/SmoothScroll';
import ContentProvider from '@/components/ContentProvider';
import { getContent } from '@/lib/cms/content';
import './globals.css';

// Red Sun type: Bodoni Moda for headlines, Space Mono for words and labels, Water Brush for one signature.
const bodoni = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--font-bodoni' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' });
const waterBrush = Water_Brush({ subsets: ['latin'], weight: '400', variable: '--font-water-brush' });

// Link previews need the full web address. Set NEXT_PUBLIC_SITE_URL once the site has a domain;
// on Vercel the project's address is picked up automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

const title = 'Adyssey — G.L. Aditya Vardhan | Graphic Designer & Photographer';
const description =
  'Adyssey is the visual journey of G.L. Aditya Vardhan: graphic designer, photographer, videographer and AI creator in Hyderabad, India.';
const ogImage = { url: '/og-image-day-1200x630.jpg', width: 1200, height: 630, alt: 'Adyssey: graphic designer, photographer, videographer and AI creator' };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Adyssey',
  // Icons and manifest from the Red Sun website kit (brand/ADYSSEY_RedSun_Website_Kit/04_Favicon_and_App_Icons)
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#B8241B' }],
  },
  manifest: '/site.webmanifest',
  openGraph: { type: 'website', siteName: 'Adyssey', title, description, images: [ogImage] },
  twitter: { card: 'summary_large_image', title, description, images: [ogImage.url] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EEE5' },
    { media: '(prefers-color-scheme: dark)', color: '#140D0E' },
  ],
};

// Before first paint: day or night from the visitor's choice, else their device; and skip the intro
// when coming back through a door.
const bootScript = `try{var d=document.documentElement,t=localStorage.getItem('theme');d.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(sessionStorage.getItem('returnDoor'))d.dataset.intro='seen'}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // the site's text, from MongoDB (cached until the Content studio saves a change)
  const content = await getContent();
  return (
    <html lang="en-GB" data-theme="light" suppressHydrationWarning className={`${bodoni.variable} ${spaceMono.variable} ${waterBrush.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="bg-bg font-sans text-[15px] leading-[26px] text-fg antialiased">
        <SmoothScroll />
        <ContentProvider value={content}>{children}</ContentProvider>
        <Grain />
        <ModeTransition />
        <CursorTrail />
      </body>
    </html>
  );
}
