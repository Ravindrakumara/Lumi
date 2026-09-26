interface HeroWaveProps {
  /** Chat's hero is slightly taller (220 viewBox units) than Lessons'
   * (200) in the mockup - controls both the wave curve and how far down
   * the gradient rect extends. */
  height?: 200 | 220;
}

/** The gradient-blue hero banner's background: a linear gradient rect plus
 * two layered wave paths (orange + a faint white sheen), ported directly
 * from the mockup's Main.dc.html / Lessons.dc.html SVGs. Purely decorative,
 * absolutely positioned behind the banner's real content. */
export function HeroWave({ height = 220 }: HeroWaveProps) {
  const gradId = `heroGrad-${height}`;
  return (
    <svg
      viewBox={`0 0 1000 ${height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a7cf0" />
          <stop offset="100%" stopColor="#2e59d1" />
        </linearGradient>
      </defs>
      <rect width="1000" height={height} fill={`url(#${gradId})`} />
      {height === 220 ? (
        <>
          <path
            d="M0,150 C160,195 320,105 500,140 C680,175 840,115 1000,145 L1000,220 L0,220 Z"
            fill="#ff6a45"
            opacity="0.32"
          />
          <path
            d="M0,175 C180,145 340,200 520,170 C700,140 860,190 1000,165 L1000,220 L0,220 Z"
            fill="#ffffff"
            opacity="0.12"
          />
        </>
      ) : (
        <path
          d="M0,140 C160,180 320,100 500,130 C680,160 840,110 1000,135 L1000,200 L0,200 Z"
          fill="#ff6a45"
          opacity="0.32"
        />
      )}
    </svg>
  );
}

/** The waving mascot illustration on the Chat hero, same SVG paths as the
 * mockup's Main.dc.html. */
export function HeroMascot({ size = 128 }: { size?: number }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} className="relative z-10 shrink-0" aria-hidden="true">
      <path
        d="M96 16h46a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10h-9l-8 14-6-14h-23a10 10 0 0 1-10-10V26a10 10 0 0 1 10-10z"
        fill="#ffffff"
      />
      <circle cx="111" cy="39" r="3.6" fill="#3b6fed" />
      <circle cx="126" cy="39" r="3.6" fill="#3b6fed" />
      <circle cx="141" cy="39" r="3.6" fill="#3b6fed" />
      <path d="M38 158c0-27 18-44 39-44s39 17 39 44" fill="#ffffff" />
      <path d="M112 122c11-4 20-15 20-26" stroke="#f4c095" strokeWidth="12" fill="none" strokeLinecap="round" />
      <circle cx="77" cy="82" r="29" fill="#f4c095" />
      <path
        d="M50 76a27 27 0 0 1 54 0c0-4-3-9-9-11-6 6-15 7-23 5-8 4-15 2-17-4-3 4-5 7-5 10z"
        fill="#3f2a1a"
      />
      <circle cx="68" cy="84" r="3" fill="#2c2c33" />
      <circle cx="87" cy="84" r="3" fill="#2c2c33" />
      <path d="M67 94c4 5 15 5 19 0" stroke="#c2410c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** The seated-with-laptop mascot on the Lessons hero, same SVG paths as
 * the mockup's Lessons.dc.html. */
export function HeroMascotLessons({ size = 104 }: { size?: number }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} className="relative z-10 shrink-0" aria-hidden="true">
      <rect x="42" y="98" width="76" height="10" rx="3" fill="#ffffff" opacity="0.9" />
      <path d="M42 98 L80 78 L118 98 L80 108 Z" fill="#ffffff" />
      <path d="M80 78 L80 108" stroke="#dbe8ff" strokeWidth="1.4" />
      <circle cx="80" cy="52" r="26" fill="#f4c095" />
      <path
        d="M56 47a24 24 0 0 1 48 0c0-4-3-8-8-10-5 5-13 6-20 4-7 4-13 2-15-3-3 3-5 6-5 9z"
        fill="#3f2a1a"
      />
      <circle cx="72" cy="53" r="2.6" fill="#2c2c33" />
      <circle cx="88" cy="53" r="2.6" fill="#2c2c33" />
      <path d="M71 61c3 4 13 4 16 0" stroke="#c2410c" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
