import { T } from '../../lib/tokens';

interface LogoProps {
  size?: number;
  mark?: boolean;
  sub?: boolean;
}

export function Logo({ size = 20, mark = true, sub = true }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      {mark && (
        <div style={{
          width: size * 1.7, height: size * 1.7, borderRadius: size * 0.5,
          flexShrink: 0, display: 'grid', placeItems: 'center', position: 'relative',
          background: 'linear-gradient(150deg,#16323a,#0c1418)',
          border: `1px solid ${T.accentLine}`,
          boxShadow: 'inset 0 0 16px rgba(37,214,193,0.12)',
        }}>
          <span style={{
            fontFamily: T.fD, fontWeight: 700, fontSize: size * 0.92,
            color: T.accent, lineHeight: 1,
          }}>ƒ</span>
          <span style={{
            position: 'absolute', right: size * 0.18, bottom: size * 0.2,
            width: size * 0.26, height: size * 0.26, borderRadius: '50%',
            background: T.accent, boxShadow: `0 0 8px ${T.accent}`,
          }} />
        </div>
      )}
      <div style={{ lineHeight: 1.05 }}>
        <div style={{
          fontFamily: T.fD, fontWeight: 700, fontSize: size * 0.86,
          letterSpacing: 0.2, color: T.text,
        }}>
          Focus<span style={{ color: T.accent }}>·</span>ASTU
        </div>
        {sub && (
          <div style={{
            fontFamily: T.fM, fontSize: size * 0.42, letterSpacing: 2.5,
            textTransform: 'uppercase', color: T.text3, marginTop: 2,
          }}>
            CP&nbsp;Hub
          </div>
        )}
      </div>
    </div>
  );
}
