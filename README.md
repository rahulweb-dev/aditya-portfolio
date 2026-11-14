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

- `brand/ADYSSEY_Logo_Website_Kit/`: the full Adyssey logo kit and its guide (not published with the site).
- `public/brand/`: the logos and hero images the site uses. Favicons, app icons, `site.webmanifest` and the link-preview image sit in `public/`.
- Link previews need the site's address: set `NEXT_PUBLIC_SITE_URL` (for example `https://adyssey.com`). On Vercel it is filled in automatically.
