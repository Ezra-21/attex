import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { AuthShell, Field } from './AuthShell';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';

export default function SignupPage() {
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/system/signup-status')
      .then((r) => setSignupOpen(r.data.open === true || r.data.open === 'true'))
      .catch(() => setSignupOpen(false));
  }, []);

  async function handleSignup() {
    if (!email.trim() || password.length < 8) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate('/complete-profile');
  }

  if (signupOpen === null) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'fa-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!signupOpen) {
    return (
      <AuthShell
        title="Invite only"
        sub="Public signup is currently closed. Join via an admin-generated invite link."
        foot={<>Already have an account? <span style={{ color: T.accentText, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in</span></>}
      >
        <div style={{
          padding: '20px', background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <Icon name="lock" size={20} style={{ color: T.text3, marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: T.fD, fontSize: 14, fontWeight: 600, color: T.text }}>
              Registration is closed
            </div>
            <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, marginTop: 4, lineHeight: 1.5 }}>
              Ask an admin to send you an invite link, or visit <span style={{ color: T.accentText }}>/invite?token=…</span> if you already have one.
            </div>
          </div>
        </div>
        <Btn kind="primary" full style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
          Sign in instead
        </Btn>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      sub="Public signup is currently open. Join the Focus ASTU community."
      foot={<>Already a member? <span style={{ color: T.accentText, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in</span></>}
    >
      {/* signup_open status banner */}
      <div style={{
        marginBottom: 18, padding: '9px 13px', borderRadius: 9,
        background: 'rgba(69,212,131,0.10)', border: '1px solid rgba(69,212,131,0.3)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: 5, background: T.gain }} />
        <span style={{ fontFamily: T.fM, fontSize: 11.5, color: T.gain, letterSpacing: 0.3 }}>
          SIGNUP_OPEN · enabled by Super Admin
        </span>
      </div>

      <Field label="Email" value={email} onChange={setEmail} placeholder="you@astu.edu.et" icon="mail" type="email" />
      <Field label="Password" value={password} onChange={setPassword} icon="lock" type="password" hint="At least 8 characters." />

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
          {error}
        </div>
      )}

      <Btn
        kind="primary" full size="lg" iconR="arrow"
        disabled={loading || !email.trim() || password.length < 8}
        onClick={handleSignup}
      >
        {loading ? 'Creating…' : 'Create account'}
      </Btn>

      <div style={{ marginTop: 14, fontFamily: T.fB, fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 1.6 }}>
        By creating an account you agree to our{' '}
        <Link to="/terms" style={{ color: T.accentText, textDecoration: 'none' }}>Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" style={{ color: T.accentText, textDecoration: 'none' }}>Privacy Policy</Link>.
      </div>
      <div style={{ marginTop: 10, fontFamily: T.fB, fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 1.5 }}>
        New accounts start as <span style={{ color: T.text2 }}>Community</span> until an admin assigns a squad.
      </div>
    </AuthShell>
  );
}
