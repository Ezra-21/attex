import type { ReactNode } from 'react';
import { T } from '../../lib/tokens';
import { Icon } from './Icon';
import { Kicker } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: string;
  iconNode?: ReactNode;
  delta?: number;
}

export function StatCard({ label, value, sub, accent, icon, iconNode, delta }: StatCardProps) {
  return (
    <div style={{
      background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: '16px 18px', position: 'relative', overflow: 'hidden', flex: 1, minWidth: 0,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        background: accent ?? T.border,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Kicker>{label}</Kicker>
        {iconNode ?? (icon && <Icon name={icon} size={16} style={{ color: T.text3 }} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
        <span className="disp num" style={{
          fontSize: 30, fontWeight: 600, color: T.text, letterSpacing: -0.5, lineHeight: 1,
        }}>{value}</span>
        {delta !== undefined && (
          <span className="num" style={{
            fontSize: 13, fontWeight: 600,
            color: delta > 0 ? T.gain : T.loss,
          }}>
            {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: T.text3, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
