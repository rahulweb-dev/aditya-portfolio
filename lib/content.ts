// The site's text. These are the starting values: once saved in the Content studio (/admin) the
// copy in MongoDB is used instead (see lib/cms/content.ts). Details come from G.L. Aditya Vardhan's resume.

export const SITE = {
  name: 'Aditya',
  fullName: 'G.L. Aditya Vardhan',
  title: 'Graphic Designer & Photographer',
  email: 'adityavardhan1502@gmail.com',
  phone: '+91 90598 91502',
  phoneHref: 'tel:+919059891502',
  location: 'Hyderabad, India',
  timezone: 'Asia/Kolkata',
  socials: [
    { label: 'ArtStation', href: 'https://adityavardhan1502.artstation.com' },
    { label: 'Instagram', href: 'https://www.instagram.com/the._adyssey/' },
  ],
};

// What "Adyssey" means: shown in the intro, the "What's in a name?" section and the footer.
export const BRAND = {
  name: 'Adyssey',
  phonetic: '/ˈæd·ɪ·si/',
  tagline: 'The visual adventures of Aditya',
  senses: [
    'Aditya + odyssey.',
    'The visual wonders and adventures of G.L. Aditya Vardhan.',
    'Like an odyssey, a long, wandering journey full of changes of fortune, challenges and growth, told in photographs, designs and films.',
  ],
  signoff: 'It’s my journey, my adventure and my story.',
};

// The italic word in 'I am a …', in the order of the crafts. 'an' before AI.
export const ROLES = [
  { article: 'a', word: 'photographer' },
  { article: 'a', word: 'graphic designer' },
  { article: 'a', word: 'videographer' },
  { article: 'an', word: 'AI creator' },
];

// "My ability card" in the hero
export const ABILITIES = [
  { skill: 'Graphic design', detail: 'Digital & print, social media, visual branding' },
  { skill: 'Photography & photo editing', detail: 'Visual storytelling, colour grading, post-production' },
  { skill: 'E-commerce creatives', detail: 'Product images for websites, ads & marketplaces' },
  { skill: 'Video editing', detail: 'Reels and edits for social media' },
  { skill: 'AI content', detail: 'AI-generated videos, concepts & mockups' },
];
export const TOOLS = ['Photoshop', 'Illustrator', 'InDesign', 'Lightroom', 'After Effects', 'Premiere Pro', 'CapCut', 'Canva', 'Figma', 'Unity'];
export const CERTIFICATIONS = ['Figma', 'Basic HTML', 'Unity'];
export const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Kannada'];

export type SkillKey = 'design' | 'photo' | 'video' | 'ai';

export type Project = {
  img?: string; // optional: the real pieces show in the gallery
  title: string;
  tag: string; // one line under the title
  kicker: string; // small caps line next to the icon
  blurb: string;
  chips: string[];
  film?: boolean;
};

export type Room = {
  key: SkillKey;
  nav: string; // menu label
  plate: string; // text on the door's gold plate
  color: string; // door colour
  title: string; // heading shown when the door is hovered, and on its page
  motto: string; // small caps line beside the door
  lead: string;
  points: string[];
  projects: Project[];
};

// Four doors, left to right. Each craft's pieces (images and videos) live on ImageKit and are managed at /admin;
// the projects below are written highlights shown under them.
export const ROOMS: Room[] = [
  {
    key: 'design',
    nav: 'Graphic Design',
    plate: 'Graphic Design',
    color: '#6B4C36', // walnut (dune-day-4): the doors share one wood; the craft icon tells them apart
    title: 'Graphic Design',
    motto: 'One brand, every format',
    lead: 'Social media posts, carousels, ad creatives and print, designed to keep every brand consistent.',
    points: ['Social media posts & carousels', 'Instagram grid layouts', 'Meta Ads & Google Display banners', 'Posters, banners & print'],
    projects: [
      {
        title: 'Automotive social media',
        tag: 'BroaddCast Business Solutions',
        kicker: 'Social · Automotive',
        blurb: 'Social media posts and carousels for automotive brands including Maruti Suzuki Arena, Nexa, Audi, Hyundai and Ashok Leyland.',
        chips: ['Social posts', 'Carousels', 'Brand consistency'],
      },
      {
        title: 'Amaya Senior Living',
        tag: 'By Vera Vita · BroaddCast Business Solutions',
        kicker: 'Campaign · Real estate',
        blurb: 'A big-budget project: Instagram grid layouts, reels and ad banners for Amaya Senior Living by Vera Vita.',
        chips: ['Instagram grid', 'Reels', 'Ad banners'],
      },
      {
        title: 'Performance ad creatives',
        tag: 'BroaddCast Business Solutions',
        kicker: 'Ads · Meta & Google',
        blurb: 'Creatives for Meta Ads and banners for Google Display campaigns.',
        chips: ['Meta Ads', 'Google Display'],
      },
      {
        title: 'NSS event creatives',
        tag: 'NSS, REVA University',
        kicker: 'Print · Events',
        blurb: 'Led the design team creating posters, banners and social media creatives for events and awareness programmes.',
        chips: ['Posters', 'Banners', 'Team lead'],
      },
    ],
  },
  {
    key: 'photo',
    nav: 'Photography',
    plate: 'Photography',
    color: '#6B4C36',
    title: 'Photography & Photo Editing',
    motto: 'Every pixel, considered',
    lead: 'Photographs and edits that tell a story, with a consistent look from the shoot to the final grade.',
    points: ['Visual storytelling', 'Artistic direction & consistency', 'Colour grading', 'Post-production'],
    projects: [], // the photographs speak for themselves
  },
  {
    key: 'video',
    nav: 'Videography',
    plate: 'Videography',
    color: '#6B4C36',
    title: 'Videography & Video Editing',
    motto: 'From the first frame to the final cut',
    lead: 'Footage shot and cut into reels and social media videos, in Premiere Pro, After Effects and CapCut.',
    points: ['Reels & short-form edits', 'Social media video', 'Colour & sound'],
    projects: [
      {
        title: 'Brand reels',
        tag: 'BroaddCast Business Solutions',
        kicker: 'Reels · Social',
        blurb: 'Reels and video edits for brand social media accounts.',
        chips: ['Premiere Pro', 'CapCut'],
      },
      {
        title: 'Amaya Senior Living reels',
        tag: 'By Vera Vita',
        kicker: 'Reels · Campaign',
        blurb: 'Reels made for the Amaya Senior Living campaign alongside its Instagram grid and ad banners.',
        chips: ['Reels', 'Campaign'],
      },
    ],
  },
  {
    key: 'ai',
    nav: 'AI Creator',
    plate: 'AI Creator',
    color: '#6B4C36',
    title: 'AI Creator',
    motto: 'The idea first, the tools second',
    lead: 'AI-generated videos and visuals, and AI tools that raise quality and speed up production.',
    points: ['AI-generated videos', 'Concepts & mockups', 'Visual variations', 'Faster workflows'],
    projects: [
      {
        title: 'AI videos for social media',
        tag: 'BroaddCast Business Solutions',
        kicker: 'AI · Video',
        blurb: 'AI-generated videos for social media, plus AI tools used to improve production quality and speed up workflows.',
        chips: ['AI video', 'Social media'],
      },
      {
        title: 'Concepts & mockups',
        tag: 'GIVA',
        kicker: 'AI · Concepts',
        blurb: 'Used generative AI tools to develop creative concepts, mockups and visual variations.',
        chips: ['Generative AI', 'Mockups'],
      },
    ],
  },
];

export const SKILLS: SkillKey[] = ['design', 'photo', 'video', 'ai'];
export const isSkill = (k: string): k is SkillKey => (SKILLS as string[]).includes(k);

export type StoryEntry = {
  year: number;
  range: string;
  date: string;
  title: string;
  org: string;
  points: string[];
  section?: string; // starts a new heading on the timeline above this entry, e.g. "Education"
};

// Newest first. The big year counter rolls to each entry's year as it scrolls into view.
export const STORY: StoryEntry[] = [
  {
    section: 'Professional Experience',
    year: 2026,
    range: 'Jul 2026 — Present',
    date: 'Jul 2026 — Present',
    title: 'Graphic Designer',
    org: 'BroaddCast Business Solutions',
    points: [
      'Social media posts and carousels for Maruti Suzuki Arena, Nexa, Audi, Hyundai and Ashok Leyland.',
      'Instagram grid layouts, reels and ad banners for Amaya Senior Living by Vera Vita.',
      'Reels, video edits and AI-generated videos for social media.',
      'Meta Ads creatives and Google Display banners.',
    ],
  },
  {
    year: 2026,
    range: 'Apr — Jun 2026',
    date: 'Apr — Jun 2026',
    title: 'Junior Artwork Developer',
    org: 'Indegene',
    points: [
      'Developed and managed digital artwork assets to high quality and accuracy standards.',
      'Ran detailed quality checks and troubleshooting for artwork consistency.',
      'Worked with cross-functional teams in fast-paced pipelines to deliver on time.',
    ],
  },
  {
    year: 2026,
    range: 'Jan — Mar 2026',
    date: 'Jan — Mar 2026',
    title: 'Creative Image Editor',
    org: 'GIVA',
    points: [
      'Edited product, model and lifestyle images for the website, social media and marketplaces.',
      'Model editing, skin retouching, colour grading and background enhancement.',
      'Used generative AI tools for concepts, mockups and visual variations.',
    ],
  },
  {
    year: 2024,
    range: '2024 — 2025',
    date: '2024 — 2025',
    title: 'Graphic Designer, design team lead',
    org: 'NSS, REVA University',
    points: [
      'Led the design team creating posters, banners and social media creatives for events.',
      'Made content that increased student participation and outreach.',
    ],
  },
  {
    year: 2023,
    range: '2023 — 2026',
    date: '2023 — 2026',
    title: 'BSc Multimedia & Animation',
    section: 'Education',
    org: 'REVA University',
    points: ['Graphic design, animation, visual storytelling and game design in Unity.'],
  },
  {
    year: 2020,
    range: '2020 — 2022',
    date: '2020 — 2022',
    title: 'Secondary education',
    org: 'Narayana College',
    points: ['Where it started.'],
  },
];

export type Role = { article: string; word: string };
export type Ability = { skill: string; detail: string };

/** Everything editable, as one object: what the site reads and the Content studio edits. */
export type SiteContent = {
  site: typeof SITE;
  brand: typeof BRAND;
  roles: Role[];
  ability: { abilities: Ability[]; tools: string[]; certifications: string[]; languages: string[] };
  rooms: Room[];
  story: StoryEntry[];
};

export const DEFAULT_CONTENT: SiteContent = {
  site: SITE,
  brand: BRAND,
  roles: ROLES,
  ability: { abilities: ABILITIES, tools: TOOLS, certifications: CERTIFICATIONS, languages: LANGUAGES },
  rooms: ROOMS,
  story: STORY,
};
