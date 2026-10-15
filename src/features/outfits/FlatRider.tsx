import {
  outermostBottom,
  outermostTop,
  type GarmentLook,
  type OutfitLook,
} from '@/domain/outfitLook';

const MANNEQUIN = '#3a4762';
const MANNEQUIN_DARK = '#2a3550';
const SKIN = '#d9b48f';

function sleeveColor(g: GarmentLook | undefined): string | undefined {
  if (!g) return undefined;
  return g.pattern === 'colorBlock' && g.colors.secondary ? g.colors.secondary : g.colors.primary;
}

/** Flat front-view rider used for quick previews in lists and the outfit builder. */
export function FlatRider({ look, className = '' }: { look: OutfitLook; className?: string }) {
  const top = outermostTop(look);
  const bottom = outermostBottom(look);
  const topColor = top?.colors.primary ?? MANNEQUIN;
  const sleeves = sleeveColor(top) ?? topColor;
  const bottomColor = bottom?.colors.primary ?? MANNEQUIN_DARK;
  const bottomPanel =
    bottom?.pattern === 'colorBlock' && bottom.colors.secondary
      ? bottom.colors.secondary
      : bottomColor;
  const isBibs = look.shellBottom?.garment === 'bibs';
  const head = look.head;
  const goggles = look.eyes;
  const neck = look.neck;
  const hands = look.hands;

  return (
    <svg viewBox="0 0 120 200" className={className} role="img" aria-label="Outfit preview">
      <ellipse cx="60" cy="194" rx="34" ry="4" fill="#000" opacity="0.35" />
      {/* legs */}
      <path d="M38 108 L58 108 L56 180 L40 180 Z" fill={bottomColor} />
      <path d="M62 108 L82 108 L80 180 L64 180 Z" fill={bottomColor} />
      <path
        d="M40 150 L56 150 L56 158 L40 158 Z M64 150 L80 150 L80 158 L64 158 Z"
        fill={bottomPanel}
        opacity="0.9"
      />
      {bottom?.colors.accent && (
        <path d="M40 176 L56 176 M64 176 L80 176" stroke={bottom.colors.accent} strokeWidth="2" />
      )}
      {/* boots */}
      <rect x="37" y="178" width="21" height="12" rx="4" fill="#11151f" />
      <rect x="62" y="178" width="21" height="12" rx="4" fill="#11151f" />
      {/* bib straps */}
      {isBibs && (
        <path
          d="M44 56 L44 104 M76 56 L76 104"
          stroke={bottomColor}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {/* sleeves */}
      <path d="M36 52 L24 64 L18 108 L28 110 L34 74 Z" fill={sleeves} />
      <path d="M84 52 L96 64 L102 108 L92 110 L86 74 Z" fill={sleeves} />
      {/* torso */}
      <path d="M36 50 Q60 42 84 50 L86 112 Q60 118 34 112 Z" fill={topColor} />
      {top?.pattern === 'colorBlock' && top.colors.secondary && (
        <path d="M36 50 Q60 42 84 50 L85 64 Q60 58 35 64 Z" fill={top.colors.secondary} />
      )}
      {(top?.pattern === 'camo' || top?.pattern === 'print') && (
        <g fill={top.colors.secondary ?? '#000'} opacity="0.55">
          <circle cx="46" cy="70" r="5" />
          <circle cx="70" cy="84" r="6" />
          <circle cx="52" cy="98" r="4" />
          <circle cx="76" cy="62" r="3.5" />
        </g>
      )}
      <path
        d="M60 48 L60 112"
        stroke={top?.colors.accent ?? '#00000033'}
        strokeWidth={top?.colors.accent ? 2.5 : 1}
      />
      {/* hands */}
      <rect x="15" y="104" width="15" height="16" rx="6" fill={hands?.colors.primary ?? SKIN} />
      <rect x="90" y="104" width="15" height="16" rx="6" fill={hands?.colors.primary ?? SKIN} />
      {hands?.colors.accent && (
        <path d="M16 106 L29 106 M91 106 L104 106" stroke={hands.colors.accent} strokeWidth="3" />
      )}
      {/* neck */}
      <rect x="51" y="38" width="18" height="12" rx="4" fill={neck?.colors.primary ?? SKIN} />
      {/* head */}
      <circle cx="60" cy="27" r="14" fill={SKIN} />
      {neck && <path d="M47 33 Q60 44 73 33 L73 46 L47 46 Z" fill={neck.colors.primary} />}
      {head?.garment === 'helmet' && (
        <>
          <path d="M43 30 Q43 9 60 9 Q77 9 77 30 Z" fill={head.colors.primary} />
          <path
            d="M43 30 L77 30 L77 27 Q60 24 43 27 Z"
            fill={head.colors.secondary ?? head.colors.primary}
          />
          {head.colors.accent && (
            <path d="M54 12 L66 12" stroke={head.colors.accent} strokeWidth="2.5" />
          )}
        </>
      )}
      {head?.garment === 'beanie' && (
        <>
          <path d="M45 24 Q45 8 60 8 Q75 8 75 24 Z" fill={head.colors.primary} />
          <rect
            x="44"
            y="20"
            width="32"
            height="6"
            rx="2"
            fill={head.colors.secondary ?? head.colors.primary}
          />
          <circle
            cx="60"
            cy="7"
            r="4"
            fill={head.colors.accent ?? head.colors.secondary ?? head.colors.primary}
          />
        </>
      )}
      {goggles ? (
        <>
          <path d="M44 27 L76 27" stroke={goggles.colors.secondary ?? '#111'} strokeWidth="4" />
          <rect x="47" y="21" width="26" height="12" rx="5" fill={goggles.colors.primary} />
          <rect
            x="49"
            y="23"
            width="22"
            height="8"
            rx="4"
            fill={goggles.colors.accent ?? '#ff8a3d'}
          />
          <path d="M51 24 L57 24" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
        </>
      ) : (
        <g fill="#1b2232">
          <circle cx="55" cy="27" r="1.6" />
          <circle cx="65" cy="27" r="1.6" />
        </g>
      )}
    </svg>
  );
}
