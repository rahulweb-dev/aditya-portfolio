// Everything you'd want to edit lives here.

export const SITE = {
  name: 'Aditya',
  email: '[YOUR EMAIL]',
  timezone: 'Asia/Kolkata',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'YouTube', href: '#' },
    { label: 'Behance', href: '#' },
  ],
};

export const ROLES = ['Photographer', 'Videographer', 'Video Editor', 'Graphic Designer', 'AI Filmmaker'];

export const ABILITIES = [
  { skill: 'Photography', detail: 'Portraits, products, events' },
  { skill: 'Videography', detail: 'Brand films, music videos, reels' },
  { skill: 'Video editing', detail: 'Cuts, colour grading, sound' },
  { skill: 'Graphic design', detail: 'Logos, posters, social media' },
  { skill: 'AI video', detail: 'Concepts, AI shots, full AI ads' },
];

export type SkillKey = 'photo' | 'video' | 'edit' | 'design' | 'ai';

export type Project = {
  img: string;
  title: string;
  tag: string; // one line under the title
  kicker: string; // small caps line next to the icon, e.g. "Portrait · Studio"
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

// One door per skill, left to right. Images live in /public/assets.
export const ROOMS: Room[] = [
  {
    key: 'photo',
    nav: 'Photography',
    plate: 'Photographer',
    color: '#2f5fd0',
    title: 'Photography',
    motto: 'Light first, the moment second',
    lead: 'Portraits, products, fashion and places, lit and framed with care.',
    points: ['Portraits and fashion', 'Product and brand shoots', 'Events and travel', 'Retouching and colour'],
    projects: [
      { img: '/assets/portrait.jpg', title: 'Portrait in Blue', tag: 'Studio portrait series', kicker: 'Portrait · Studio', blurb: '[One or two lines about the shoot: who it was for, the idea and how you lit it.]', chips: ['Lighting', 'Retouching', 'Colour'] },
      { img: '/assets/silk.jpg', title: 'Golden Court', tag: 'Streetwear campaign', kicker: 'Fashion · Campaign', blurb: '[One or two lines about the shoot: who it was for, the idea and how you lit it.]', chips: ['Styling', 'Location', 'Retouching'] },
      { img: '/assets/dune.jpg', title: 'Salt Road', tag: 'Travel story', kicker: 'Travel · Landscape', blurb: '[One or two lines about the trip and what you set out to capture.]', chips: ['Landscape', 'Editing'] },
    ],
  },
  {
    key: 'video',
    nav: 'Videography',
    plate: 'Videographer',
    color: '#3a3f4a',
    title: 'Videography',
    motto: 'From the first frame to the final shot',
    lead: 'Brand films, music videos and reels, shot to be felt in the first second.',
    points: ['Brand films and ads', 'Music videos', 'Reels and short-form', 'Events and documentaries'],
    projects: [
      { img: '/assets/city.jpg', title: 'Night Shift', tag: 'Brand film', kicker: 'Film · Brand', blurb: '[What the brand needed, how you shot it and where it ran.]', chips: ['Direction', 'Cinematography'], film: true },
      { img: '/assets/flare.jpg', title: 'Encore', tag: 'Music video', kicker: 'Film · Music', blurb: '[The artist, the concept and the shoot in a couple of lines.]', chips: ['Live shoot', 'Gimbal', 'Lighting'], film: true },
      { img: '/assets/sea.jpg', title: 'Low Tide', tag: 'Short documentary', kicker: 'Film · Documentary', blurb: '[The story and the people in it.]', chips: ['Drone', 'Interviews'], film: true },
    ],
  },
  {
    key: 'edit',
    nav: 'Video Editing',
    plate: 'Video Editor',
    color: '#8fbf95',
    title: 'Video Editing',
    motto: 'Every cut has a reason',
    lead: 'Cutting raw footage into stories: pace, colour grade and sound.',
    points: ['Story edits and reels', 'Colour grading', 'Sound design and mixing', 'Motion graphics and titles'],
    projects: [
      { img: '/assets/forest.jpg', title: 'First Light', tag: 'Colour grade', kicker: 'Edit · Colour', blurb: '[The look you built and the before/after difference.]', chips: ['DaVinci Resolve', 'Grading'], film: true },
      { img: '/assets/flare.jpg', title: 'Encore: the cut', tag: 'Music video edit', kicker: 'Edit · Music', blurb: '[How you cut to the beat and shaped the story.]', chips: ['Rhythm edit', 'Effects'], film: true },
      { img: '/assets/city.jpg', title: 'Night Shift: 30s', tag: 'Ad cut-down', kicker: 'Edit · Advert', blurb: '[Turning a long film into a 30-second ad.]', chips: ['Cut-downs', 'Sound mix'], film: true },
    ],
  },
  {
    key: 'design',
    nav: 'Graphic Design',
    plate: 'Graphic Designer',
    color: '#e2682a',
    title: 'Graphic Design',
    motto: 'One brand, every format',
    lead: 'Logos, posters and social media visuals that keep a brand consistent everywhere.',
    points: ['Logos and brand identity', 'Posters and print', 'Social media posts and carousels', 'Thumbnails and covers'],
    projects: [
      { img: '/assets/mono.jpg', title: '[Brand identity]', tag: '[Client name]', kicker: 'Design · Identity', blurb: '[The brief, the logo and how the system works across formats.]', chips: ['Logo', 'Brand guide'] },
      { img: '/assets/silk.jpg', title: '[Campaign poster]', tag: '[Client name]', kicker: 'Design · Print', blurb: '[The idea behind the poster and where it was used.]', chips: ['Poster', 'Typography'] },
      { img: '/assets/dune.jpg', title: '[Social media set]', tag: '[Client name]', kicker: 'Design · Social', blurb: '[The series of posts and carousels you designed.]', chips: ['Instagram', 'Carousels'] },
    ],
  },
  {
    key: 'ai',
    nav: 'AI Films',
    plate: 'AI Filmmaker',
    color: '#7b3fc4',
    title: 'AI Films',
    motto: 'The idea first, the tools second',
    lead: 'From a written idea to finished AI video: concept, generated shots, edit and sound.',
    points: ['AI ads and brand films', 'Concept and pitch videos', 'AI music visuals', 'Mixed real and AI footage'],
    projects: [
      { img: '/assets/flare.jpg', title: '[AI music visual]', tag: '[Artist name]', kicker: 'AI · Music', blurb: '[The concept, the AI tools you used and how you edited it together.]', chips: ['AI video', 'Edit'], film: true },
      { img: '/assets/sea.jpg', title: '[AI brand ad]', tag: '[Client name]', kicker: 'AI · Advert', blurb: '[The brief and how AI shots made it possible.]', chips: ['AI video', 'Sound'], film: true },
      { img: '/assets/forest.jpg', title: '[AI short film]', tag: 'Personal project', kicker: 'AI · Short film', blurb: '[The story and how it was made.]', chips: ['AI video', 'Story'], film: true },
    ],
  },
];

export const isSkill = (k: string): k is SkillKey => ROOMS.some(r => r.key === k);

export type StoryEntry = { year: number; range: string; date: string; title: string; org: string; points: string[] };

// Newest first. The big year counter rolls to each entry's year as it scrolls into view.
export const STORY: StoryEntry[] = [
  {
    year: 2026,
    range: '2026 — Now',
    date: '2026 — Now',
    title: 'Independent creator',
    org: 'Working for myself, remote-first',
    points: ['Photography, films, edits, design and AI video for brands and artists.', '[Add a highlight: a client, a campaign or a result.]'],
  },
  { year: 2025, range: '[Month] 2025 — [Month] 2025', date: '2025', title: '[Role, e.g. AI video creator]', org: '[Company or client]', points: ['[What you made and what came of it.]'] },
  { year: 2024, range: '[Month] 2024 — [Month] 2024', date: '2024', title: '[Role, e.g. Video editor]', org: '[Company or client]', points: ['[What you made and what came of it.]'] },
  { year: 2023, range: '[Month] 2023 — [Month] 2023', date: '2023', title: '[Role, e.g. Graphic designer]', org: '[Company or client]', points: ['[What you made and what came of it.]'] },
  { year: 2022, range: '[Month] 2022', date: '2022', title: '[Where it started, e.g. first camera]', org: '[School, course or first client]', points: ['[The moment you started shooting.]'] },
];
