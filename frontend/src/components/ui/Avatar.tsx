import { T } from '../../lib/tokens';
import { Icon } from './Icon';
import { getInitials, avatarHue, isStreakActive } from '../../lib/format';

// Re-exported for backward compatibility with existing imports.
export { isStreakActive };

interface AvatarProps {
  name: string;
  size?: number;
  banned?: boolean;
  ring?: boolean;
}

export function Avatar({ name, size = 40, banned, ring }: AvatarProps) {
  const initials = getInitials(name);
  const h = avatarHue(name);

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.fD, fontWeight: 600, fontSize: size * 0.38, color: '#fff',
      background: banned
        ? T.surface3
        : `linear-gradient(145deg, oklch(0.55 0.12 ${h}), oklch(0.4 0.10 ${h + 20}))`,
      filter: banned ? 'grayscale(1) opacity(0.6)' : 'none',
      border: ring ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
    }}>
      {banned ? <Icon name="ban" size={size * 0.5} /> : initials}
    </div>
  );
}

// SVG gradient defs for the flame — render once near root
export function FlameDef() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* Active: deep orange → amber → gold */}
        <linearGradient id="flameG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#ff3d00" />
          <stop offset="45%"  stopColor="#ff8c00" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>
        {/* Inactive: dark grey */}
        <linearGradient id="flameGrey" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#383e4a" />
          <stop offset="100%" stopColor="#525a68" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Streak display ────────────────────────────────────────────────────────
interface StreakProps {
  days: number;
  /** true = submitted today (EAT) → glowing flame; false = grey */
  active: boolean;
  size?: 'sm' | 'md';
}

export function Streak({ days, active, size = 'md' }: StreakProps) {
  const ic = size === 'sm' ? 20 : 28;
  const fs = size === 'sm' ? 13 : 17;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: T.fD, fontWeight: 700, fontSize: fs,
      color: active ? T.streak : T.text3,
    }}>
      <span style={{
        display: 'inline-flex',
        animation: active ? 'fa-flame 1.6s ease-in-out infinite' : 'none',
        filter: active
          ? 'drop-shadow(0 0 6px rgba(255,100,30,0.8)) drop-shadow(0 2px 10px rgba(255,160,40,0.5))'
          : 'none',
      }}>
        <svg width={ic} height={ic} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          {/* Outer flame body */}
          <path
            d="M12 2c1 3-1 4-2 6s-1 4 1 4c1.5 0 2-1 2-2 1 1 2 2.5 2 4a5 5 0 0 1-10 0c0-3 2-5 3-7 1-2 4-3 4-5z"
            fill={active ? 'url(#flameG)' : 'url(#flameGrey)'}
            opacity={active ? 1 : 0.5}
          />
          {/* Inner hot core — visible only when active */}
          {active && (
            <path
              d="M12 11c.4 1.2 0 2.2-1 3.2a2.2 2.2 0 0 0 4 0c0-1.3-.8-2.1-1.5-3.2-.3 1.3-1.5 1-1.5 0z"
              fill="#fff3c0"
              opacity={0.5}
            />
          )}
        </svg>
      </span>
      <span className="num">{days}</span>
    </span>
  );
}

// ── Flame icon only (no count) — for use inside StatCard ─────────────────
export function FlameIcon({ active, size = 18 }: { active: boolean; size?: number }) {
  return (
    <span style={{
      display: 'inline-flex',
      animation: active ? 'fa-flame 1.6s ease-in-out infinite' : 'none',
      filter: active
        ? 'drop-shadow(0 0 5px rgba(255,100,30,0.85)) drop-shadow(0 2px 8px rgba(255,160,40,0.5))'
        : 'none',
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M12 2c1 3-1 4-2 6s-1 4 1 4c1.5 0 2-1 2-2 1 1 2 2.5 2 4a5 5 0 0 1-10 0c0-3 2-5 3-7 1-2 4-3 4-5z"
          fill={active ? 'url(#flameG)' : 'url(#flameGrey)'}
          opacity={active ? 1 : 0.5}
        />
        {active && (
          <path
            d="M12 11c.4 1.2 0 2.2-1 3.2a2.2 2.2 0 0 0 4 0c0-1.3-.8-2.1-1.5-3.2-.3 1.3-1.5 1-1.5 0z"
            fill="#fff3c0"
            opacity={0.5}
          />
        )}
      </svg>
    </span>
  );
}
