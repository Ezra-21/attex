import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import { T } from '../../lib/tokens';

type BtnKind = 'primary' | 'accentGhost' | 'ghost' | 'solid' | 'danger';
type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps {
  children?: ReactNode;
  kind?: BtnKind;
  size?: BtnSize;
  icon?: string;
  iconR?: string;
  full?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const SIZES: Record<BtnSize, { p: string; fs: number; gap: number }> = {
  sm: { p: '7px 12px',  fs: 12.5, gap: 6 },
  md: { p: '10px 16px', fs: 13.5, gap: 7 },
  lg: { p: '13px 22px', fs: 15,   gap: 9 },
};

const KINDS: Record<BtnKind, CSSProperties> = {
  primary:     { background: T.accent,      color: '#04201d', border: `1px solid ${T.accent}`,                         fontWeight: 600 },
  accentGhost: { background: T.accentGhost, color: T.accentText, border: `1px solid ${T.accentLine}`,                  fontWeight: 600 },
  ghost:       { background: 'transparent', color: T.text2,   border: `1px solid ${T.border}`,                         fontWeight: 500 },
  solid:       { background: T.surface3,    color: T.text,    border: `1px solid ${T.border}`,                         fontWeight: 500 },
  danger:      { background: 'rgba(242,101,79,0.12)', color: T.loss, border: '1px solid rgba(242,101,79,0.4)',          fontWeight: 600 },
};

export function Btn({
  children, kind = 'primary', size = 'md',
  icon, iconR, full, style, onClick, disabled, type = 'button',
}: BtnProps) {
  const sz = SIZES[size];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: sz.gap, padding: sz.p, fontSize: sz.fs,
        fontFamily: T.fD, letterSpacing: 0.1, borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', width: full ? '100%' : 'auto',
        transition: 'filter .15s', opacity: disabled ? 0.5 : 1,
        ...KINDS[kind], ...style,
      }}
    >
      {icon  && <Icon name={icon}  size={sz.fs + 2} />}
      {children}
      {iconR && <Icon name={iconR} size={sz.fs + 2} />}
    </button>
  );
}
