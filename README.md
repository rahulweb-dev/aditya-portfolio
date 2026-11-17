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

## Content studio (CMS)

The work shown on the four Work pages lives on **ImageKit**, one folder per craft
(`/adyssey/design`, `/adyssey/photo`, `/adyssey/video`, `/adyssey/ai`). Each file carries its
title, position and size as custom metadata.

Manage it at **/admin** (sign in first at /admin/login):

- upload images and videos (drag and drop; they go straight from the browser to ImageKit)
- rename a piece (an empty title shows as "Design 03", "Frame 12" …)
- reorder (drag, or the ← → buttons) and delete

The public pages refresh within seconds of a change (and at most every 5 minutes otherwise).

### Environment variables

Set these in `.env.local` for local work, and in your host's settings (e.g. Vercel → Project →
Settings → Environment Variables) for the live site. Never commit them.

| Name | What it is |
| --- | --- |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key (server only) |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | e.g. https://ik.imagekit.io/your_id |
| `IMAGEKIT_FOLDER` | `/adyssey` |
| `ADMIN_USERNAME` | the login name |
| `ADMIN_PASSWORD` | the login password (or, safer, `ADMIN_PASSWORD_HASH` below, which wins if both are set) |
| `ADMIN_PASSWORD_HASH` | `salt:hash` (scrypt). Make one with: `node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" 'new password'` |
| `AUTH_SECRET` | a long random string that signs the login cookie |

| `MONGODB_URI` | MongoDB connection string (the site's text) |
| `MONGODB_DB` | optional, defaults to `adyssey` |

### The site's text (MongoDB)

Crafts (names, lines, introductions, highlights), the story timeline, contact details and links,
the "I am a …" words, the ability card and the "What's in a name?" section are edited under
**Crafts**, **Story** and **About & contact** in the dashboard. They're stored in MongoDB
(database `adyssey`, collection `content`, one document `_id: "main"`); anything never saved
uses the starting text in `lib/content.ts`. A save updates the live site at once.

For a hosted site on MongoDB Atlas, allow the host to connect: Atlas → Network Access → add
`0.0.0.0/0` (Vercel's addresses change), protected by the database user's password.
