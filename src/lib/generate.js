// THE PAGE MAKER
// Turns a story into 1 or 2 junk journal pages using plain rules
// (no AI yet). Each detected detail becomes an item on the page:
//   place -> label     route -> boarding pass   person -> name tag
//   food -> doodle     feeling line -> torn quote   wish -> hanging tag
//   mood -> mood chip  story -> handwritten note
// Positions are percentages of the page, so pages scale to any screen.

import { uid } from './storage.js';

const PLACES = [
  'goa', 'delhi', 'new delhi', 'mumbai', 'bombay', 'jaipur', 'udaipur', 'manali', 'shimla', 'rishikesh',
  'kerala', 'munnar', 'ladakh', 'leh', 'kashmir', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
  'pune', 'noida', 'gurgaon', 'gurugram', 'pondicherry', 'puducherry', 'varanasi', 'agra', 'amritsar', 'darjeeling',
  'gangtok', 'coorg', 'ooty', 'mysore', 'hampi', 'jodhpur', 'jaisalmer', 'mussoorie', 'nainital', 'kasol',
  'paris', 'london', 'tokyo', 'kyoto', 'osaka', 'bali', 'bangkok', 'singapore', 'dubai', 'new york', 'rome',
  'barcelona', 'amsterdam', 'berlin', 'lisbon', 'seoul', 'istanbul', 'sydney', 'melbourne', 'vietnam', 'thailand',
  'japan', 'italy', 'france', 'spain', 'nepal', 'sri lanka', 'maldives', 'bhutan',
];

const TRAVEL_WORDS = [
  'trip', 'travel', 'travelled', 'traveled', 'flight', 'flew', 'airport', 'train', 'station', 'beach', 'hotel',
  'hostel', 'vacation', 'holiday', 'road trip', 'mountains', 'trek', 'hike', 'visited', 'explored', 'sightseeing',
  'passport', 'boarding', 'cab to', 'drove to', 'ferry', 'sunset point',
];

const FEEL_WORDS = [
  'feel', 'feeling', 'felt', 'anxious', 'anxiety', 'sad', 'cried', 'cry', 'lonely', 'overwhelmed', 'grateful',
  'proud', 'scared', 'afraid', 'hurt', 'angry', 'upset', 'miss', 'missed', 'heartbroken', 'stressed', 'numb',
  'confused', 'hopeful', 'heavy', 'lost', 'relieved', 'guilty', 'insecure', 'loved',
];

export const MOODS = {
  happy: ['happy', 'fun', 'great', 'amazing', 'laughed', 'joy', 'yay', 'awesome', 'best day', 'smiled', 'lovely'],
  calm: ['calm', 'peaceful', 'relaxed', 'slow', 'quiet', 'cozy', 'cosy', 'chill', 'rested'],
  excited: ['excited', "can't wait", 'cant wait', 'thrilled', 'pumped', 'finally'],
  grateful: ['grateful', 'thankful', 'blessed', 'lucky'],
  proud: ['proud', 'nailed', 'did it', 'achieved', 'promoted', 'finished'],
  loved: ['loved', 'love', 'hug', 'cared', 'special'],
  tired: ['tired', 'exhausted', 'sleepy', 'drained', 'long day', 'burnt out'],
  anxious: ['anxious', 'nervous', 'worried', 'stressed', 'overwhelmed', 'panic', 'scared'],
  sad: ['sad', 'cried', 'lonely', 'upset', 'hurt', 'miss', 'missed', 'heavy', 'low', 'down', 'rough', 'bad day', 'awful'],
};

export const MOOD_LABEL = {
  happy: 'happy', calm: 'calm', excited: 'excited', grateful: 'grateful', proud: 'proud',
  loved: 'loved', tired: 'tired', anxious: 'anxious', sad: 'blue', meh: 'just a day',
};

const RELATIONS = {
  mom: 'Mom', mum: 'Mum', mummy: 'Mummy', mother: 'Mom', dad: 'Dad', papa: 'Papa', father: 'Dad',
  sister: 'Sister', brother: 'Brother', bestie: 'Bestie', 'best friend': 'Best friend', grandma: 'Grandma',
  nani: 'Nani', dadi: 'Dadi', nana: 'Nana', dada: 'Dada', grandpa: 'Grandpa', boyfriend: 'Boyfriend',
  girlfriend: 'Girlfriend', husband: 'Husband', wife: 'Wife', partner: 'Partner', roommate: 'Roommate',
  manager: 'Manager', team: 'The team', cousin: 'Cousin', friends: 'Friends',
};

const FOODS = {
  drink: ['chai', 'coffee', 'tea', 'latte', 'cold coffee', 'smoothie', 'juice', 'matcha', 'beer', 'wine', 'lassi', 'boba'],
  bowl: ['maggi', 'noodles', 'ramen', 'biryani', 'dal', 'rice', 'momos', 'pasta', 'soup', 'dosa', 'idli', 'thali',
    'pizza', 'burger', 'sushi', 'pani puri', 'golgappe', 'chaat', 'paratha', 'sandwich', 'fries', 'salad', 'breakfast',
    'lunch', 'dinner', 'brunch'],
  sweet: ['cake', 'ice cream', 'dessert', 'brownie', 'cookie', 'chocolate', 'gulab jamun', 'jalebi', 'pastry', 'donut'],
};

const WEATHER = {
  rain: ['rain', 'rained', 'raining', 'monsoon', 'drizzle', 'storm'],
  sun: ['sunny', 'sunshine', 'summer', 'sunset', 'sunrise', 'heatwave'],
  cloud: ['cloudy', 'foggy', 'fog', 'smog', 'winter', 'chilly', 'snow'],
};

const NOT_NAMES = new Set([
  'I', 'The', 'A', 'An', 'Today', 'Yesterday', 'Then', 'So', 'And', 'But', 'We', 'My', 'It', 'This', 'That',
  'He', 'She', 'They', 'Our', 'Me', 'You', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  'Sunday', 'Also', 'After', 'Before', 'Later', 'Finally', 'Morning', 'Evening', 'Night', 'Office', 'Work', 'Home',
]);

export const PROMPTS = [
  'Tell me one small thing from today. A meal, a person, a moment.',
  'What made you smile today, even a little?',
  'Where did you go today, and who was there?',
  'What is something you want to remember from this week?',
  'What is on your mind right now?',
  'Describe today like a postcard to a friend.',
  'What was the best thing you ate today?',
];

const has = (text, word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
const cap = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());

export function splitSentences(text) {
  return (text.replace(/\s+/g, ' ').match(/[^.!?\n]+[.!?]*/g) || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

// Reads the story and returns everything we spotted.
export function detect(text = '') {
  const t = text.trim();
  const sentences = splitSentences(t);
  const words = t ? t.split(/\s+/).length : 0;

  const places = [];
  PLACES.forEach((p) => has(t, p) && places.push(cap(p)));
  const placeRe = /\b(?:in|at|visited|went to|flew to|drove to|trip to|reached|landed in)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/g;
  let m;
  while ((m = placeRe.exec(t))) {
    const p = m[1];
    if (!NOT_NAMES.has(p.split(' ')[0]) && !places.some((x) => x.toLowerCase() === p.toLowerCase())) places.push(p);
  }

  const routeM = t.match(/\bfrom\s+([A-Z][a-zA-Z]+)\s+to\s+([A-Z][a-zA-Z]+)/);
  const route = routeM ? { from: routeM[1], to: routeM[2] } : null;

  const people = [];
  Object.entries(RELATIONS).forEach(([k, v]) => {
    if (has(t, k) && !people.some((p) => p.name === v)) people.push({ name: v, rel: '' });
  });
  const nameRe = /\b(?:with|met|call|called|saw|hugged|texted|and)\s+([A-Z][a-z]{2,})/g;
  while ((m = nameRe.exec(t))) {
    const n = m[1];
    const isPlace = places.some((p) => p.toLowerCase().startsWith(n.toLowerCase()));
    if (!NOT_NAMES.has(n) && !isPlace && !people.some((p) => p.name === n)) people.push({ name: n, rel: 'friend' });
  }

  let foods = [];
  Object.entries(FOODS).forEach(([kind, list]) =>
    list.forEach((f) => has(t, f) && foods.push({ kind, name: f })),
  );
  foods = foods.filter((f) => !foods.some((o) => o !== f && o.name.includes(f.name)));

  let weather = null;
  Object.entries(WEATHER).forEach(([kind, list]) => {
    if (!weather && list.some((w) => has(t, w))) weather = kind;
  });

  const moodScores = Object.fromEntries(
    Object.entries(MOODS).map(([mood, list]) => [mood, list.filter((w) => has(t, w)).length]),
  );
  const topMood = Object.entries(moodScores).sort((a, b) => b[1] - a[1])[0];
  const mood = topMood && topMood[1] > 0 ? topMood[0] : 'meh';

  const travelScore = TRAVEL_WORDS.filter((w) => has(t, w)).length + places.length * 2 + (route ? 3 : 0);
  const feelScore = FEEL_WORDS.filter((w) => has(t, w)).length * 1.5;
  let theme = 'everyday';
  if (travelScore >= 2 && travelScore >= feelScore) theme = 'travel';
  else if (feelScore >= 2) theme = 'feelings';

  const wish = sentences.find((s) =>
    /\b(want to|wanna|wish|hope|next time|someday|can't wait|cant wait|planning to|i should|going to try)\b/i.test(s),
  );
  const feelLines = sentences.filter(
    (s) => FEEL_WORDS.some((w) => has(s, w)) && s.length >= 18 && s.length <= 140 && s !== wish,
  );
  const quote = feelLines.sort((a, b) => a.length - b.length)[0] || null;

  const songM = t.match(/\b(?:listening to|song|playing)\s+([^.,!?]{3,40})/i);
  const song = songM ? songM[1].trim() : null;

  return { text: t, sentences, words, places, route, people: people.slice(0, 3), foods, weather, mood, theme, wish, quote, song };
}

// Little labels shown live while someone types or talks.
export function chipsFor(d) {
  const chips = [];
  if (d.route) chips.push({ k: 'route', label: `${d.route.from} to ${d.route.to}` });
  d.places.slice(0, 2).forEach((p) => chips.push({ k: 'place', label: p }));
  d.people.forEach((p) => chips.push({ k: 'person', label: p.name }));
  d.foods.slice(0, 2).forEach((f) => chips.push({ k: 'food', label: f.name }));
  if (d.weather) chips.push({ k: 'weather', label: d.weather });
  if (d.mood !== 'meh') chips.push({ k: 'mood', label: MOOD_LABEL[d.mood] });
  if (d.wish) chips.push({ k: 'wish', label: 'a wish' });
  return chips;
}

function makeTitle(d) {
  if (d.theme === 'travel' && d.route) return `${d.route.from} to ${d.route.to}`;
  if (d.theme === 'travel' && d.places[0]) return d.places[0];
  const first = (d.sentences[0] || 'today').replace(/^(so|today|okay|ok|well|um|and)[, ]+/i, '').replace(/^i\s/i, 'I ');
  const words = first.replace(/[.!?]+$/, '').split(' ').slice(0, 5).join(' ');
  return words.length > 30 ? words.slice(0, 28).trim() + '…' : words;
}

function clip(sentences, maxChars) {
  let out = '';
  const used = [];
  for (const s of sentences) {
    if ((out + ' ' + s).length > maxChars && out) break;
    out = (out + ' ' + s).trim();
    used.push(s);
  }
  if (!out && sentences[0]) out = sentences[0].slice(0, maxChars - 1) + '…';
  return { text: out, used: used.length || 1 };
}

export function dateLabel(ts) {
  const d = new Date(ts);
  const day = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  return `${day} · ${date}`;
}

function doodlesFor(d) {
  const list = [];
  d.foods.forEach((f) => list.push(f.kind === 'drink' ? 'cup' : f.kind === 'sweet' ? 'cake' : 'bowl'));
  if (d.weather) list.push(d.weather);
  if (d.theme === 'travel') list.push('plane', 'leaf');
  if (['happy', 'loved', 'grateful'].includes(d.mood)) list.push('heart');
  if (['calm', 'tired'].includes(d.mood)) list.push('moon');
  list.push('star', 'flower', 'burst', 'arrow');
  return [...new Set(list)];
}

const item = (type, slot, props = {}, z = 1) => ({ id: uid(), type, z, ...slot, props });

const PAPER = {
  everyday: { texture: 'grid', tone: 0 },
  travel: { texture: 'dots', tone: 1 },
  feelings: { texture: 'lined', tone: 2 },
};

// For rough days: keep only the words, no page.
export function makeNoteEntry(text, { mode = 'type', style = 'pop' } = {}) {
  const d = detect(text);
  const now = Date.now();
  return {
    id: uid(),
    kind: 'note',
    createdAt: now,
    updatedAt: now,
    mode,
    style,
    text: d.text,
    title: makeTitle(d),
    theme: d.theme,
    mood: d.mood,
    people: d.people.map((p) => p.name),
    places: d.places,
    song: d.song,
    words: d.words,
    pages: [],
  };
}

// Turns a skipped-page note into a full entry later, keeping its id and date.
export function pagesForNote(note) {
  const fresh = generateEntry(note.text, { mode: note.mode, style: note.style });
  return { ...note, kind: 'page', pages: fresh.pages, title: fresh.title, updatedAt: Date.now() };
}

export function generateEntry(text, { mode = 'type', style = 'pop' } = {}) {
  const d = detect(text);
  const now = Date.now();
  const twoPages = d.sentences.length > 4 || d.words > 70;
  const doodles = doodlesFor(d);
  const title = makeTitle(d);

  // ---- Page 1 ----
  const p1 = [];
  p1.push(item('title', { x: 6, y: 5, w: 60, rot: -2 }, { text: title }, 5));
  p1.push(item('date', { x: 70, y: 5, w: 24, rot: 6 }, { text: dateLabel(now) }, 5));
  p1.push(item('photo', { x: 7, y: 21, w: 48, rot: -3 }, { src: null }, 2));
  p1.push(item('tape', { x: 19, y: 19, w: 24, rot: -7 }, { pattern: 'stripes', color: 1 }, 6));

  let sideUsed = 'none';
  if (d.route) {
    p1.push(item('ticket', { x: 57, y: 22, w: 38, rot: 4 }, { from: d.route.from, to: d.route.to }, 3));
    sideUsed = 'ticket';
  } else if (d.places[0]) {
    p1.push(item('label', { x: 58, y: 24, w: 36, rot: 4 }, { text: d.places[0] }, 3));
    sideUsed = 'label';
  } else if (d.people[0]) {
    p1.push(item('nametag', { x: 59, y: 23, w: 34, rot: 5 }, d.people[0], 3));
    sideUsed = 'person';
  } else {
    p1.push(item('doodle', { x: 64, y: 22, w: 24, rot: 8 }, { kind: doodles.shift() }, 3));
  }

  const firstNote = clip(d.sentences, twoPages ? 150 : 230);
  if (d.quote) p1.push(item('quote', { x: 40, y: 52, w: 55, rot: 2 }, { text: d.quote }, 4));
  p1.push(item('note', { x: 6, y: d.quote ? 65 : 56, w: twoPages ? 52 : 58, rot: -1 }, { text: firstNote.text }, 3));

  const p1Doodles = [
    { x: 61, y: 41, w: 14, rot: -6 },
    { x: 80, y: 41, w: 12, rot: 10 },
    { x: 84, y: 66, w: 11, rot: -8 },
  ];
  p1Doodles.forEach((s) => doodles.length && p1.push(item('doodle', s, { kind: doodles.shift() }, 4)));

  if (!twoPages) {
    if (d.wish) p1.push(item('tag', { x: 66, y: 64, w: 28, rot: 6 }, { text: d.wish }, 5));
    d.people
      .filter((_, i) => !(sideUsed === 'person' && i === 0))
      .slice(0, 1)
      .forEach((p) => p1.push(item('nametag', { x: 62, y: 76, w: 30, rot: -4 }, p, 5)));
  }
  p1.push(item('mood', { x: twoPages ? 62 : 8, y: twoPages ? 84 : 88, w: 30, rot: -4 }, { mood: d.mood }, 6));

  const pages = [{ id: uid(), paper: { ...PAPER[d.theme] }, items: p1 }];

  // ---- Page 2 ----
  if (twoPages) {
    const rest = d.sentences.slice(firstNote.used);
    const p2 = [];
    p2.push(item('tape', { x: 32, y: 3, w: 36, rot: 2 }, { pattern: 'dots', color: 2 }, 6));
    p2.push(item('note', { x: 8, y: 7, w: 64, rot: 1 }, { text: clip(rest.length ? rest : d.sentences, 420).text }, 3));
    p2.push(item('photo', { x: 52, y: 46, w: 42, rot: 4 }, { src: null }, 2));
    p2.push(item('tape', { x: 63, y: 44, w: 20, rot: 10 }, { pattern: 'plain', color: 3 }, 6));
    if (d.wish) p2.push(item('tag', { x: 8, y: 54, w: 34, rot: -5 }, { text: d.wish }, 5));
    d.people
      .filter((_, i) => !(sideUsed === 'person' && i === 0))
      .slice(0, 2)
      .forEach((p, i) => p2.push(item('nametag', { x: 9 + i * 3, y: 74 + i * 10, w: 34, rot: i ? 3 : -3 }, p, 5)));
    const p2Doodles = [
      { x: 77, y: 10, w: 14, rot: 8 },
      { x: 44, y: 76, w: 12, rot: -10 },
      { x: 82, y: 88, w: 11, rot: 6 },
    ];
    p2Doodles.forEach((s) => doodles.length && p2.push(item('doodle', s, { kind: doodles.shift() }, 4)));
    pages.push({ id: uid(), paper: { ...PAPER[d.theme], tone: (PAPER[d.theme].tone + 3) % 5 }, items: p2 });
  }

  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    mode,
    style,
    text: d.text,
    title,
    theme: d.theme,
    mood: d.mood,
    people: d.people.map((p) => p.name),
    places: d.places,
    song: d.song,
    words: d.words,
    pages,
  };
}
