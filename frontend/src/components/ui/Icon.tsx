import type { CSSProperties } from 'react';

const ICONS: Record<string, string> = {
  dashboard:    'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z',
  problems:     'M4 4h16M4 4v16M4 20h16M8 9l2 2-2 2M13 13h4',
  contests:     'M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3',
  squad:        'M3 5h6v6H3zM3 16h6M3 13h6M13 4l8 0M13 9l8 0M13 15l8 0M13 20l8 0',
  announce:     'M3 11l14-6v14L3 13zM3 11v2M17 8a3 3 0 0 1 0 6M7 13v5a1 1 0 0 0 1 1h1',
  profile:      'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  settings:     'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L16 2H8l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L8 22h8l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  admin:        'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M9 12l2 2 4-4',
  search:       'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-4.3-4.3',
  flame:        'M12 2c1 3-1 4-2 6s-1 4 1 4c1.5 0 2-1 2-2 1 1 2 2.5 2 4a5 5 0 0 1-10 0c0-3 2-5 3-7 1-2 4-3 4-5z',
  copy:         'M9 9h11v11H9zM5 15H4V4h11v1',
  check:        'M4 12l5 5L20 6',
  chevron:      'M9 6l6 6-6 6',
  chevronD:     'M6 9l6 6 6-6',
  plus:         'M12 5v14M5 12h14',
  arrow:        'M5 12h14M13 6l6 6-6 6',
  arrowL:       'M19 12H5M11 6l-6 6 6 6',
  external:     'M14 5h5v5M19 5l-8 8M11 5H5v14h14v-6',
  bolt:         'M13 2L4 14h6l-1 8 9-12h-6z',
  lock:         'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  mail:         'M3 6h18v12H3zM3 7l9 6 9-6',
  ban:          'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M6 6l12 12',
  key:          'M15 7a4 4 0 1 0-3.5 4l1.5 1.5 2 0 0 2 2 0 0 2 3 0 0-3-5-5z',
  book:         'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v14',
  trophy:       'M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3',
  clock:        'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2',
  link:         'M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1',
  filter:       'M3 5h18l-7 8v6l-4 2v-8z',
  logout:       'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  verse:        'M12 3v18M5 7h14M7 3h10v4a5 5 0 0 1-10 0z',
  tag:          'M20 7H9.5a2 2 0 0 0-1.4.6L3 13l5.1 5.4c.4.4.9.6 1.4.6H20a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM7 13h.01',
};

interface IconProps {
  name: keyof typeof ICONS;
  size?: number;
  sw?: number;
  style?: CSSProperties;
  fill?: string;
  className?: string;
}

export function Icon({ name, size = 18, sw = 1.8, style, fill, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ?? 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      className={className}
    >
      <path d={ICONS[name] ?? ''} />
    </svg>
  );
}
