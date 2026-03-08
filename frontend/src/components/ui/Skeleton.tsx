import { T } from '../../lib/tokens';

interface SkeletonProps {
  w?: number | string;
  h?: number;
  radius?: number;
  style?: React.CSSProperties;
}

export function Sk({ w = '100%', h = 14, radius = 6, style }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width: w, height: h, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

// ── Stat card skeleton ────────────────────────────────────────────────────
export function StatCardSk() {
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: T.border }} />
      <Sk w={60} h={10} style={{ marginBottom: 14 }} />
      <Sk w={80} h={30} radius={8} style={{ marginBottom: 8 }} />
      <Sk w={100} h={10} />
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────────────────────
export function TableRowSk({ cols = 4 }: { cols?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: `1px solid ${T.borderSoft}` }}>
      <Sk w={20} h={20} radius={5} />
      <Sk w={52} h={20} radius={5} />
      <Sk w="45%" h={14} style={{ flex: 1 }} />
      {cols >= 3 && <Sk w={80} h={14} />}
      {cols >= 4 && <Sk w={60} h={14} />}
      <Sk w={16} h={16} radius={4} />
    </div>
  );
}

// ── Card row skeleton (contest cards, announcement cards) ─────────────────
export function CardRowSk() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 13 }}>
      <Sk w={46} h={46} radius={11} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Sk w="60%" h={16} />
        <Sk w="40%" h={11} />
      </div>
      <Sk w={18} h={18} radius={4} />
    </div>
  );
}

// ── Profile identity card skeleton ────────────────────────────────────────
export function ProfileCardSk() {
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Sk w={84} h={84} radius={84 * 0.32} />
      <Sk w="70%" h={20} radius={8} />
      <Sk w="40%" h={11} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Sk w={80} h={24} radius={7} />
        <Sk w={70} h={24} radius={7} />
      </div>
      <Sk w="90%" h={11} />
      <Sk w="80%" h={11} />
    </div>
  );
}

// ── Track card skeleton ───────────────────────────────────────────────────
export function TrackSk() {
  return (
    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', background: T.surface3 }}>
        <Sk w={34} h={34} radius={9} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Sk w="50%" h={15} />
          <Sk w="25%" h={10} />
        </div>
        <Sk w={120} h={6} radius={4} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px 11px 30px', borderTop: `1px solid ${T.borderSoft}` }}>
          <Sk w={14} h={14} radius={3} />
          <Sk w="55%" h={13} style={{ flex: 1 }} />
          <Sk w={90} h={6} radius={3} />
        </div>
      ))}
    </div>
  );
}

// ── User table row skeleton ───────────────────────────────────────────────
export function UserRowSk() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderTop: `1px solid ${T.borderSoft}` }}>
      <Sk w={32} h={32} radius={32 * 0.32} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Sk w="45%" h={13} />
        <Sk w="60%" h={10} />
      </div>
      <Sk w={110} h={26} radius={7} />
      <Sk w={120} h={26} radius={7} />
      <Sk w={46} h={13} />
      <Sk w={80} h={22} radius={7} />
    </div>
  );
}
