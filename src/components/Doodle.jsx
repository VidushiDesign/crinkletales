// Hand-drawn-style stickers as SVG. Each has a Pop skin (bright fill,
// thick ink line) and a Japandi skin (ink line, muted wash).

const POP = ['#F5C431', '#FF5B37', '#2E4BFF', '#C8DDB0', '#CFE0FF', '#FBE7A6'];
const JAP = ['#D8C9B2', '#C9A27E', '#B9C2A8', '#D5CCBF', '#C7CCD6', '#E3D5C1'];

const SHAPES = {
  star: (f) => <path d="M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2z" fill={f(0)} />,
  heart: (f) => <path d="M50 86C20 66 8 48 12 32c4-16 24-22 38-6 14-16 34-10 38 6 4 16-8 34-38 54z" fill={f(1)} />,
  flower: (f) => (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="50" cy="28" rx="13" ry="20" fill={f(5)} transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="11" fill={f(0)} />
    </g>
  ),
  burst: (f) => (
    <path
      d="M50 6l8 20 20-10-6 22 22 6-20 10 12 18-22-2 2 22-16-14-16 14 2-22-22 2 12-18-20-10 22-6-6-22 20 10z"
      fill={f(4)}
    />
  ),
  arrow: () => <path d="M10 70c20-30 46-40 72-34M70 24l14 12-16 10" fill="none" strokeLinecap="round" />,
  cup: (f) => (
    <g>
      <path d="M22 38h46l-5 42a6 6 0 01-6 5H33a6 6 0 01-6-5z" fill={f(4)} />
      <path d="M68 46h6a9 9 0 010 18h-8" fill="none" />
      <path d="M36 14c-4 6 4 10 0 16M50 12c-4 6 4 10 0 16" fill="none" strokeLinecap="round" />
    </g>
  ),
  bowl: (f) => (
    <g>
      <path d="M12 46h76c0 22-16 36-38 36S12 68 12 46z" fill={f(2)} />
      <path d="M30 40c4-10 14-14 22-8 6-8 18-6 20 8" fill={f(0)} />
      <path d="M60 12l-8 30M72 16L58 42" fill="none" strokeLinecap="round" />
    </g>
  ),
  cake: (f) => (
    <g>
      <path d="M18 50h64v32H18z" fill={f(5)} />
      <path d="M18 50c8 8 16 0 21 6s14-6 21 0 14 6 22-6" fill={f(1)} />
      <path d="M50 22v20" />
      <path d="M50 10c5 5 5 9 0 12-5-3-5-7 0-12z" fill={f(0)} />
    </g>
  ),
  rain: (f) => (
    <g>
      <path d="M26 56a16 16 0 010-32 22 22 0 0142-4 14 14 0 017 36z" fill={f(4)} />
      <path d="M34 68l-4 12M52 68l-4 12M70 68l-4 12" fill="none" strokeLinecap="round" />
    </g>
  ),
  cloud: (f) => <path d="M24 72a18 18 0 010-36 24 24 0 0146-6 16 16 0 016 42z" fill={f(4)} />,
  sun: (f) => (
    <g>
      <circle cx="50" cy="50" r="18" fill={f(0)} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M50 18V6" strokeLinecap="round" transform={`rotate(${a} 50 50)`} />
      ))}
    </g>
  ),
  plane: (f) => (
    <path d="M8 56l30-6 22-34c4-6 12-4 10 4l-8 30 26 4 4-10h8l-4 22-56 12z" fill={f(2)} strokeLinejoin="round" />
  ),
  leaf: (f) => (
    <g>
      <path d="M20 82C14 44 40 16 84 14c2 44-24 70-64 68z" fill={f(3)} />
      <path d="M22 80C38 60 54 44 74 26" fill="none" />
    </g>
  ),
  moon: (f) => <path d="M64 12a38 38 0 1022 62A32 32 0 0164 12z" fill={f(5)} />,
};

export const DOODLE_KINDS = Object.keys(SHAPES);

export default function Doodle({ kind = 'star', skin = 'pop', className }) {
  const shape = SHAPES[kind] || SHAPES.star;
  const pal = skin === 'japandi' ? JAP : POP;
  const fill = (i) => pal[i % pal.length];
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
      stroke={skin === 'japandi' ? '#2B2A27' : '#1B1A17'}
      strokeWidth={skin === 'japandi' ? 2.2 : 4}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shape(fill)}
    </svg>
  );
}

// Tiny faces for the mood chip.
export function MoodFace({ mood = 'meh', skin = 'pop', fill }) {
  const stroke = skin === 'japandi' ? '#B5452F' : '#1B1A17';
  const mouths = {
    happy: 'M34 60c8 10 24 10 32 0',
    excited: 'M32 56c6 16 30 16 36 0z',
    loved: 'M34 60c8 10 24 10 32 0',
    grateful: 'M36 60c6 6 22 6 28 0',
    proud: 'M34 58c8 10 24 10 32 0',
    calm: 'M38 62h24',
    tired: 'M38 64c6-4 18-4 24 0',
    anxious: 'M34 64c5-5 9 5 14 0s9 5 14 0',
    sad: 'M34 66c8-10 24-10 32 0',
    meh: 'M38 62h24',
  };
  const eyes = mood === 'tired' || mood === 'calm' ? 'M32 42c3 3 7 3 10 0M58 42c3 3 7 3 10 0' : null;
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill={skin === 'japandi' ? 'none' : fill || '#F5C431'} stroke={stroke} strokeWidth="5" />
      {eyes ? (
        <path d={eyes} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      ) : (
        <g fill={stroke}>
          <circle cx="37" cy="42" r="5" />
          <circle cx="63" cy="42" r="5" />
        </g>
      )}
      <path
        d={mouths[mood] || mouths.meh}
        fill={mood === 'excited' ? stroke : 'none'}
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
