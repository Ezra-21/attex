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