// ---------- Settings: edit these ----------
const TIMEZONE = 'Asia/Kolkata';
const ROLES = ['Photographer', 'Videographer', 'Video Editor', 'Graphic Designer', 'AI Filmmaker'];

// What's behind each door. Swap images in /assets and edit the text.
const ROOMS = {
  photo: {
    kicker: 'Door 01 · Photography',
    title: 'Photography',
    lead: 'Portraits, products, fashion and places, lit and framed with care.',
    points: ['Portraits and fashion', 'Product and brand shoots', 'Events and travel', 'Retouching and colour'],
    projects: [
      { img: 'portrait.jpg', title: 'Portrait in Blue', tag: 'Portrait' },
      { img: 'silk.jpg', title: 'Golden Court', tag: 'Fashion' },
      { img: 'dune.jpg', title: 'Salt Road', tag: 'Travel' }
    ]
  },
  video: {
    kicker: 'Door 02 · Videography',
    title: 'Videography',
    lead: 'Brand films, music videos and reels, shot to be felt in the first second.',
    points: ['Brand films and ads', 'Music videos', 'Reels and short-form', 'Events and documentaries'],
    projects: [
      { img: 'city.jpg', title: 'Night Shift', tag: 'Brand film', film: true },
      { img: 'flare.jpg', title: 'Encore', tag: 'Music video', film: true },
      { img: 'sea.jpg', title: 'Low Tide', tag: 'Documentary', film: true }
    ]
  },
  edit: {
    kicker: 'Door 03 · Video Editing',
    title: 'Video Editing',
    lead: 'Cutting raw footage into stories: pace, colour grade and sound.',
    points: ['Story edits and reels', 'Colour grading', 'Sound design and mixing', 'Motion graphics and titles'],
    projects: [
      { img: 'forest.jpg', title: 'First Light', tag: 'Colour grade', film: true },
      { img: 'flare.jpg', title: 'Encore: the cut', tag: 'Music edit', film: true },
      { img: 'city.jpg', title: 'Night Shift: 30s', tag: 'Ad edit', film: true }
    ]
  },
  design: {
    kicker: 'Door 04 · Graphic Design',
    title: 'Graphic Design',
    lead: 'Logos, posters and social media visuals that keep a brand consistent everywhere.',
    points: ['Logos and brand identity', 'Posters and print', 'Social media posts and carousels', 'Thumbnails and covers'],
    projects: [
      { img: 'mono.jpg', title: '[Brand identity]', tag: 'Identity' },
      { img: 'silk.jpg', title: '[Campaign poster]', tag: 'Poster' },
      { img: 'dune.jpg', title: '[Social media set]', tag: 'Social' }
    ]
  },
  ai: {
    kicker: 'Door 05 · AI Films',
    title: 'AI Films',
    lead: 'From a written idea to finished AI video: concept, generated shots, edit and sound.',
    points: ['AI ads and brand films', 'Concept and pitch videos', 'AI music visuals', 'Mixed real and AI footage'],
    projects: [
      { img: 'flare.jpg', title: '[AI music visual]', tag: 'AI film', film: true },
      { img: 'sea.jpg', title: '[AI brand ad]', tag: 'AI ad', film: true },
      { img: 'forest.jpg', title: '[AI short film]', tag: 'AI short', film: true }
    ]
  }
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Local time ----------
function tick() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE }).replace(' ', '').toLowerCase();
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIMEZONE });
  $$('.js-time').forEach(el => { el.textContent = time; });
  $$('.js-date').forEach(el => { el.textContent = date; });
  $$('.js-year-now').forEach(el => { el.textContent = now.getFullYear(); });
}
tick();
setInterval(tick, 15000);

// ---------- Pull cord: light / dark ----------
const cord = $('#cord');
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
}
cord.addEventListener('click', () => {
  cord.classList.add('pulled');
  setTimeout(() => { toggleTheme(); cord.classList.remove('pulled'); }, 220);
});

// ---------- Notebook role flip ----------
const page = $('.page');
const roleEl = $('.js-role');
let roleIndex = 0;
$('.js-role-n').textContent = String(ROLES.length).padStart(2, '0');
function nextRole() {
  roleIndex = (roleIndex + 1) % ROLES.length;
  const swap = () => {
    roleEl.textContent = ROLES[roleIndex];
    $('.js-role-i').textContent = String(roleIndex + 1).padStart(2, '0');
  };
  if (reduceMotion) return swap();
  page.classList.remove('flip');
  void page.offsetWidth;
  page.classList.add('flip');
  setTimeout(swap, 280);
}
setInterval(nextRole, 2600);

// ---------- Ability card ----------
const abilityBtn = $('.js-ability');
const ability = $('#ability');
abilityBtn.addEventListener('click', () => {
  ability.hidden = !ability.hidden;
  abilityBtn.setAttribute('aria-expanded', String(!ability.hidden));
});

// ---------- Doors ----------
const section = $('#work');
const room = $('#room');
let openDoor = null;

function fillRoom(key) {
  const r = ROOMS[key];
  $('.js-room-kicker').textContent = r.kicker;
  $('.js-room-title').textContent = r.title;
  $('.js-room-lead').textContent = r.lead;
  $('.js-room-points').innerHTML = r.points.map(p => `<li>${p}</li>`).join('');
  $('.js-room-grid').innerHTML = r.projects.map(p => `
    <article class="card">
      <div class="card-img">
        <img src="assets/${p.img}" alt="${p.title}" loading="lazy">
        ${p.film ? '<span class="badge">▶ Film</span>' : ''}
      </div>
      <h4>${p.title}</h4>
      <p>${p.tag}</p>
    </article>`).join('');
}

function enterRoom(key) {
  const door = $(`.door[data-skill="${key}"]`);
  if (!door || !ROOMS[key]) return;
  closeRoom(true);
  openDoor = door;
  door.classList.add('open');
  fillRoom(key);
  setTimeout(() => {
    section.classList.add('in-room');
    room.hidden = false;
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }, reduceMotion ? 0 : 750);
}

function closeRoom(silent) {
  room.hidden = true;
  section.classList.remove('in-room');
  if (openDoor) {
    const d = openDoor;
    openDoor = null;
    if (!silent) d.focus({ preventScroll: true });
    setTimeout(() => d.classList.remove('open'), silent ? 0 : 200);
  }
  if (!silent) section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

$$('.door').forEach(door => door.addEventListener('click', () => enterRoom(door.dataset.skill)));
$('.js-room-back').addEventListener('click', () => closeRoom(false));
$$('[data-open]').forEach(link => link.addEventListener('click', e => {
  e.preventDefault();
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  setTimeout(() => enterRoom(link.dataset.open), reduceMotion ? 0 : 450);
}));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !room.hidden) closeRoom(false); });

// ---------- Story timeline: year rolls as you scroll ----------
const entries = $$('.entry');
const yearEl = $('.js-year');
const rangeEl = $('.js-range');
$('.js-steps').textContent = String(entries.length).padStart(2, '0');
let shownYear = Number(yearEl.textContent);
let rollFrame = 0;

function rollYear(target) {
  cancelAnimationFrame(rollFrame);
  if (reduceMotion) { shownYear = target; yearEl.textContent = target; return; }
  const from = shownYear;
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / 600);
    const eased = 1 - Math.pow(1 - t, 3);
    shownYear = Math.round(from + (target - from) * eased);
    yearEl.textContent = shownYear;
    if (t < 1) rollFrame = requestAnimationFrame(step);
  };
  rollFrame = requestAnimationFrame(step);
}

function activate(entry) {
  const i = entries.indexOf(entry);
  entries.forEach(e => e.classList.toggle('active', e === entry));
  rollYear(Number(entry.dataset.year));
  rangeEl.textContent = entry.dataset.range;
  $('.js-step').textContent = String(i + 1).padStart(2, '0');
  $('.js-bar').style.width = `${((i + 1) / entries.length) * 100}%`;
}

const io = new IntersectionObserver(items => {
  items.forEach(item => { if (item.isIntersecting) activate(item.target); });
}, { rootMargin: '-45% 0px -45% 0px' });
entries.forEach(e => io.observe(e));
activate(entries[0]);
