import type { CSSProperties, ReactNode } from 'react';
import { T } from '../../lib/tokens';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  accent?: boolean;
}

export function Card({ children, style, pad = 20, accent }: CardProps) {
  return (
    <div style={{
      background: T.surface2, border: `1px solid ${accent ? T.accentLine : T.border}`,
      borderRadius: 14, padding: pad, ...style,
    }}>
      {children}
    </div>
  );
}

export function Kicker({
  children, color = T.text3, style,
}: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{
      fontFamily: T.fM, fontSize: 11, letterSpacing: 2,
      textTransform: 'uppercase', color, ...style,
    }}>
      {children}
    </div>
  );
}
