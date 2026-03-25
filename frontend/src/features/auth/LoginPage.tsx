import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { AuthShell, Field } from './AuthShell';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';

type State = 'idle' | 'sending' | 'sent' | 'error';
type Mode  = 'magic' | 'password';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState<Mode>('magic');
  const [state, setState]       = useState<State>('idle');
  const [errMsg, setErrMsg]     = useState('');

  async function handleMagicLink() {
    if (!email.trim()) return;
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setErrMsg(error.message); setState('error'); }
    else setState('sent');
  }

  async function handlePasswordLogin() {
    if (!email.trim() || !password) return;
    setState('sending');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) { setErrMsg(error.message); setState('error'); }
    // On success onAuthStateChange fires → PublicOnlyRoute redirects to /dashboard
  }

  function switchMode(next: Mode) {
    setMode(next);
    setState('idle');
    setErrMsg('');
  }

  if (state === 'sent') {
    return (
      <AuthShell title="Check your inbox" sub="A magic link is on its way — click it to sign in.">
        <div style={{
          padding: '22px 20px', background: T.accentGhost, border: `1px solid ${T.accentLine}`,
          borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <Icon name="mail" size={20} style={{ color: T.accent, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: T.fD, fontSize: 14, fontWeight: 600, color: T.text }}>
              Sent to {email}
            </div>
            <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, marginTop: 4, lineHeight: 1.5 }}>
              The link expires in 10 minutes. Check spam if it doesn't arrive.
            </div>
          </div>
        </div>
        <Btn kind="ghost" full style={{ marginTop: 16 }} onClick={() => setState('idle')}>
          Try a different email
        </Btn>
      </AuthShell>
    );
  }

  const isPassword = mode === 'password';

  return (
    <AuthShell
      title="Welcome back"
      sub={isPassword ? 'Sign in with your email and password.' : 'Sign in with a magic link — no password to remember.'}
      foot={<>Don't have an account?{' '}<span style={{ color: T.accentText, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/signup')}>Sign up</span></>}
    >
      <Field label="Email" value={email} onChange={setEmail} placeholder="you@astu.edu.et" icon="mail" type="email" />

      {isPassword && (
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          icon="lock"
          type="password"
          right={
            <span
              style={{ fontFamily: T.fB, fontSize: 12, color: T.accentText, cursor: 'pointer', fontWeight: 500 }}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </span>
          }
        />
      )}

      {state === 'error' && (
        <div style={{
          marginBottom: 14, padding: '10px 13px', borderRadius: 9,
          background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)',
          fontFamily: T.fB, fontSize: 12.5, color: T.loss,
        }}>{errMsg}</div>
      )}

      {isPassword ? (
        <Btn
          kind="primary" full size="lg" icon="key"
          disabled={state === 'sending' || !email.trim() || !password}
          onClick={handlePasswordLogin}
        >
          {state === 'sending' ? 'Signing in…' : 'Sign in'}
        </Btn>
      ) : (
        <Btn
          kind="primary" full size="lg" iconR="arrow"
          disabled={state === 'sending' || !email.trim()}
          onClick={handleMagicLink}
        >
          {state === 'sending' ? 'Sending…' : 'Send magic link'}
        </Btn>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
        <span style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>OR</span>
        <span style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      {isPassword ? (
        <Btn kind="solid" full size="lg" icon="mail" onClick={() => switchMode('magic')}>
          Send magic link instead
        </Btn>
      ) : (
        <Btn kind="solid" full size="lg" icon="key" onClick={() => switchMode('password')}>
          Sign in with password
        </Btn>
      )}

      {!isPassword && (
        <div style={{
          marginTop: 22, padding: '12px 14px',
          background: T.accentGhost, border: `1px solid ${T.accentLine}`,
          borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="mail" size={16} style={{ color: T.accent, marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontFamily: T.fB, fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>
            We'll email a one-time link. Click it and you're in — handled securely by Supabase Auth.
          </span>
        </div>
      )}
    </AuthShell>
  );
}
