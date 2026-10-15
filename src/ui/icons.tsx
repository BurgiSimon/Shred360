import type { SVGProps } from 'react';

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const HangerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 7a2 2 0 1 1 2-2c0 1-.8 1.4-2 2.2v1.3L21 14a1.6 1.6 0 0 1-.8 3H3.8A1.6 1.6 0 0 1 3 14l9-5.5" />
  </svg>
);
export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3 2 8l10 5 10-5-10-5Z" />
    <path d="m2 13 10 5 10-5" />
    <path d="m2 17.5 10 5 10-5" opacity=".5" />
  </svg>
);
export const CubeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
    <path d="M3 7l9 5 9-5M12 12v10" />
  </svg>
);
export const ShareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
  </svg>
);
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
export const EditIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
  </svg>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </svg>
);
export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8L12 3Z" />
  </svg>
);
export const RotateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);
