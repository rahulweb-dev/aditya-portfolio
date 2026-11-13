// Everything you'd want to edit lives here. Details come from G.L. Aditya Vardhan's resume.

export const SITE = {
  name: 'Aditya',
  fullName: 'G.L. Aditya Vardhan',
  title: 'Graphic Designer & Creative Editor',
  email: 'adityavardhan1502@gmail.com',
  phone: '+91 90598 91502',
  phoneHref: 'tel:+919059891502',
  location: 'Hyderabad, India',
  timezone: 'Asia/Kolkata',
  socials: [{ label: 'ArtStation', href: 'https://adityavardhan1502.artstation.com' }],
};

// The flipping word in "I am a …"
export const ROLES = ['Graphic Designer', 'Creative Editor', 'Photo Retoucher', 'Video Editor', 'AI Content Creator'];

// "My ability card" in the hero
export const ABILITIES = [
  { skill: 'Graphic design', detail: 'Digital & print, social media, visual branding' },
  { skill: 'Image editing', detail: 'Retouching, model & skin editing, colour correction' },
  { skill: 'E-commerce creatives', detail: 'Product images for websites, ads & marketplaces' },
  { skill: 'Video editing', detail: 'Reels and edits for social media' },
  { skill: 'AI content', detail: 'AI-generated videos, concepts & mockups' },
];
export const TOOLS = ['Photoshop', 'Illustrator', 'InDesign', 'Lightroom', 'After Effects', 'Premiere Pro', 'CapCut', 'Canva', 'Figma', 'Unity'];
export const CERTIFICATIONS = ['Figma', 'Basic HTML', 'Unity'];
export const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Kannada'];

export type SkillKey = 'photo' | 'video' | 'edit' | 'design' | 'ai';

export type Project = {
  img: string;
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
  title: string;
  motto: string; // small caps line beside the door
  lead: string;
  points: string[];
  projects: Project[];
};

// One door per skill, left to right. Project images in /public/assets are placeholders: swap in real work.
export const ROOMS: Room[] = [
  {
    key: 'design',
    nav: 'Graphic Design',
    plate: 'Graphic Designer',
    color: '#e2682a',
    title: 'Graphic Design',
    motto: 'One brand, every format',
    lead: 'Social media posts, carousels, ad creatives and print, designed to keep every brand consistent.',
    points: ['Social media posts & carousels', 'Instagram grid layouts', 'Meta Ads & Google Display banners', 'Posters, banners & print'],
    projects: [
      {
        img: '/assets/city.jpg',
        title: 'Automotive social media',
        tag: 'BroaddCast Business Solutions',
        kicker: 'Social · Automotive',
        blurb: 'Social media posts and carousels for automotive brands including Maruti Suzuki Arena, Nexa, Audi, Hyundai and Ashok Leyland.',
        chips: ['Social posts', 'Carousels', 'Brand consistency'],
      },
      {
        img: '/assets/forest.jpg',
        title: 'Amaya Senior Living',
        tag: 'By Vera Vita · BroaddCast Business Solutions',
        kicker: 'Campaign · Real estate',
        blurb: 'A big-budget project: Instagram grid layouts, reels and ad banners for Amaya Senior Living by Vera Vita.',
        chips: ['Instagram grid', 'Reels', 'Ad banners'],
      },
      {
        img: '/assets/mono.jpg',
        title: 'Performance ad creatives',
        tag: 'BroaddCast Business Solutions',
        kicker: 'Ads · Meta & Google',
        blurb: 'Creatives for Meta Ads and banners for Google Display campaigns.',
        chips: ['Meta Ads', 'Google Display'],
      },
      {
        img: '/assets/flare.jpg',
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
    plate: 'Photo Editor',
    color: '#2f5fd0',
    title: 'Photography & Retouching',
    motto: 'Every pixel, considered',
    lead: 'Product, model and lifestyle images edited for websites, social media and marketplaces.',
    points: ['Model editing & skin retouching', 'Colour grading & correction', 'Mood & lifestyle shots', 'Photography'],
    projects: [
      {
        img: '/assets/portrait.jpg',
        title: 'Model & product retouching',
        tag: 'GIVA',
        kicker: 'Retouching · Jewellery',
        blurb: 'Edited and enhanced product, model and lifestyle images: skin retouching, colour grading and background enhancement, working with the photography team.',
        chips: ['Skin retouching', 'Colour grading', 'Backgrounds'],
      },
      {
        img: '/assets/silk.jpg',
        title: 'Mood & lifestyle shots',
        tag: 'GIVA',
        kicker: 'Editing · Brand story',
        blurb: 'Created and edited mood shots and lifestyle visuals to strengthen brand storytelling.',
        chips: ['Mood shots', 'Lifestyle'],
      },
      {
        img: '/assets/dune.jpg',
        title: 'Marketplace creatives',
        tag: 'GIVA',
        kicker: 'E-commerce · Marketplaces',
        blurb: 'Optimised creatives for e-commerce marketplaces to improve how products are presented.',
        chips: ['E-commerce', 'Product images'],
      },
    ],
  },
  {
    key: 'edit',
    nav: 'Video Editing',
    plate: 'Video Editor',
    color: '#8fbf95',
    title: 'Video Editing',
    motto: 'Every cut has a reason',
    lead: 'Reels and video edits for social media, cut in Premiere Pro, After Effects and CapCut.',
    points: ['Reels & short-form edits', 'Social media video', 'Motion graphics', 'Colour & sound'],
    projects: [
      {
        img: '/assets/city.jpg',
        title: 'Brand reels',
        tag: 'BroaddCast Business Solutions',
        kicker: 'Reels · Social',
        blurb: 'Reels and video edits for brand social media accounts.',
        chips: ['Premiere Pro', 'CapCut'],
        film: true,
      },
      {
        img: '/assets/forest.jpg',
        title: 'Amaya Senior Living reels',
        tag: 'By Vera Vita',
        kicker: 'Reels · Campaign',
        blurb: 'Reels made for the Amaya Senior Living campaign alongside its Instagram grid and ad banners.',
        chips: ['Reels', 'Campaign'],
        film: true,
      },
    ],
  },
  {
    key: 'video',
    nav: 'Videography',
    plate: 'Videographer',
    color: '#3a3f4a',
    title: 'Videography',
    motto: 'From the first frame to the final shot',
    lead: '[A line about the footage you shoot.]',
    points: ['[What you shoot]', '[What you shoot]', '[What you shoot]'],
    projects: [
      { img: '/assets/sea.jpg', title: '[Your shoot]', tag: '[Client or project]', kicker: 'Film', blurb: '[What you shot and how.]', chips: ['[Camera]'], film: true },
    ],
  },
  {
    key: 'ai',
    nav: 'AI Content',
    plate: 'AI Creator',
    color: '#7b3fc4',
    title: 'AI Content',
    motto: 'The idea first, the tools second',
    lead: 'AI-generated videos and visuals, and AI tools that raise quality and speed up production.',
    points: ['AI-generated videos', 'Concepts & mockups', 'Visual variations', 'Faster workflows'],
    projects: [
      {
        img: '/assets/flare.jpg',
        title: 'AI videos for social media',
        tag: 'BroaddCast Business Solutions',
        kicker: 'AI · Video',
        blurb: 'AI-generated videos for social media, plus AI tools used to improve production quality and speed up workflows.',
        chips: ['AI video', 'Social media'],
        film: true,
      },
      {
        img: '/assets/sea.jpg',
        title: 'Concepts & mockups',
        tag: 'GIVA',
        kicker: 'AI · Concepts',
        blurb: 'Used generative AI tools to develop creative concepts, mockups and visual variations.',
        chips: ['Generative AI', 'Mockups'],
      },
    ],
  },
];

export const isSkill = (k: string): k is SkillKey => ROOMS.some(r => r.key === k);

export type StoryEntry = { year: number; range: string; date: string; title: string; org: string; points: string[] };

// Newest first. The big year counter rolls to each entry's year as it scrolls into view.
export const STORY: StoryEntry[] = [
  {
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
