import { useState, type ReactNode } from 'react';
import { T } from '../../lib/tokens';
import { Logo } from '../../components/ui/Logo';
import { useVerse } from '../landing/useLandingData';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';

interface AuthShellProps {
  children: ReactNode;
  title: string;
  sub: string;
  foot?: ReactNode;
  wide?: boolean;
}

export function AuthShell({ children, title, sub, foot, wide }: AuthShellProps) {
  const { data: verse } = useVerse();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  if (isMobile) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Compact mobile header — logo + verse snippet */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg,#0c1216,#080a0d)',
          borderBottom: `1px solid ${T.border}`,
          padding: '24px 24px 26px',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(90% 160% at 50% 0%, rgba(37,214,193,0.12), transparent 65%)',
          }} />
          <div style={{ position: 'relative' }}>
            <Logo size={18} />
            {verse?.text && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  fontFamily: T.fB, fontStyle: 'italic', fontSize: 13,
                  lineHeight: 1.55, color: T.text, letterSpacing: -0.1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}>
                  "{verse.text}"
                </div>
                <div style={{
                  fontFamily: T.fD, fontSize: 11, fontWeight: 600,
                  color: T.accentText, marginTop: 5,
                }}>
                  — {verse.reference}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, padding: '28px 24px 48px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: wide ? 460 : 400, margin: '0 auto' }}>
            <h1 style={{
              margin: '0 0 6px', fontFamily: T.fD, fontSize: 24,
              fontWeight: 600, color: T.text, letterSpacing: -0.5,
            }}>
              {title}
            </h1>
            <p style={{ margin: '0 0 24px', fontFamily: T.fB, fontSize: 14, color: T.text2, lineHeight: 1.5 }}>
              {sub}
            </p>
            {children}
            {foot && (
              <div style={{ marginTop: 24, textAlign: 'center', fontFamily: T.fB, fontSize: 13, color: T.text3 }}>
                {foot}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────
  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex' }}>
      {/* Brand rail */}
      <div style={{
        width: '42%', minWidth: 340, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#0c1216,#080a0d)',
        borderRight: `1px solid ${T.border}`,
        padding: '40px 42px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(70% 60% at 20% 10%, rgba(37,214,193,0.10), transparent 60%)',
        }} />
        <div style={{ position: 'relative' }}>
          <Logo size={20} />
        </div>
        <div style={{ position: 'relative', marginTop: 'auto' }}>
          {/* IBM Plex Sans italic — not Spectral */}
          <div style={{
            fontFamily: T.fB, fontStyle: 'italic', fontSize: 22,
            lineHeight: 1.5, color: T.text, letterSpacing: -0.2,
          }}>
            "{verse?.text}"
          </div>
          <div style={{
            fontFamily: T.fD, fontSize: 13.5, fontWeight: 600,
            color: T.accentText, marginTop: 16,