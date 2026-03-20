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
          }}>
            — {verse?.reference}
          </div>
          <div style={{ marginTop: 34, display: 'flex', gap: 18, fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
            <span>Focus ASTU</span><span>·</span>
            <span>Adama, Ethiopia</span><span>·</span>
            <span>Invite-only</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px' }}>
        <div style={{ width: '100%', maxWidth: wide ? 460 : 380 }}>
          <h1 style={{ margin: '0 0 6px', fontFamily: T.fD, fontSize: 27, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>
            {title}
          </h1>
          <p style={{ margin: '0 0 28px', fontFamily: T.fB, fontSize: 14, color: T.text2, lineHeight: 1.5 }}>
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

// ── Shared form field ─────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: string;
  type?: string;
  locked?: boolean;
  hint?: string;
  mono?: boolean;
  required?: boolean;
  right?: ReactNode;
}

export function Field({
  label, value, onChange, placeholder, icon, type = 'text',
  locked, hint, mono, required, right,
}: FieldProps) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <label style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>
          {label}
          {required && <span style={{ color: T.loss, marginLeft: 4 }}>*</span>}
        </label>
        {right}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: T.surface, border: `1px solid ${locked ? T.borderSoft : T.border}`,
        borderRadius: 9, padding: '11px 13px', opacity: locked ? 0.75 : 1,
      }}>
        {icon && (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <FieldIcon name={icon} />
          </svg>
        )}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={locked}
          style={{
            fontFamily: mono ? T.fM : T.fB, fontSize: 14,
            color: value ? T.text : T.text3, flex: 1,
            background: 'transparent', border: 'none', outline: 'none',
            cursor: locked ? 'not-allowed' : 'text',
          }}
        />
        {isPassword && !locked && (
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            style={{
              background: 'none', border: 'none', padding: 2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', flexShrink: 0, color: T.text3,
            }}
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              {showPass ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M10.73 10.73a3 3 0 0 0 4.24 4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
        {locked && (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        )}
      </div>
      {hint && <div style={{ fontFamily: T.fB, fontSize: 11.5, color: T.text3, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function FieldIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    mail:    'M3 6h18v12H3zM3 7l9 6 9-6',
    lock:    'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
    profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    link:    'M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1',
    key:     'M15 7a4 4 0 1 0-3.5 4l1.5 1.5 2 0 0 2 2 0 0 2 3 0 0-3-5-5z',
  };
  return <path d={paths[name] ?? ''} />;
}
