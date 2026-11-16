# aditya-portfolio

Portfolio for photography, videography, video editing, graphic design and AI films. Built with Next.js, Tailwind CSS and Three.js.

## Run it

```
npm install
npm run dev
```

Open http://localhost:3000.

For the real (faster) version: `npm run build` then `npm start`.

## Edit the content

- `lib/content.ts`: name, email, socials, roles, the five doors and their projects, and the timeline.
- `public/assets/`: images. The current photos are Unsplash placeholders; replace them with your own work.

## Brand

- `brand/ADYSSEY_RedSun_Website_Kit/`: the Red Sun kit (day and night logos, badges, craft icons, favicons, link previews, hero scenes, `head-code.html`). Not published with the site.
- `brand/ADYSSEY_Logo_Website_Kit/`: the first kit, retired (its red #FF3B30 and aura pictures are no longer used).
- `public/logo/`, `public/icons/`, `public/hero/`: the logos, craft icons and desert scenes the site uses. Favicons, app icons, `site.webmanifest` and the link-preview image sit in `public/`.
- Colours, type and rules follow the Adyssey design system (Red Sun): paper, ink and sun red by day; night, cream and REC red by night; Bodoni Moda and Space Mono; no orange, violet or pink.
- Link previews need the site's address: set `NEXT_PUBLIC_SITE_URL` (for example `https://adyssey.com`). On Vercel it is filled in automatically.
