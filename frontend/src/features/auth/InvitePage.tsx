import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { AuthShell, Field } from './AuthShell';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';

type TokenState = 'checking' | 'valid' | 'invalid' | 'used' | 'expired';

interface ValidateResponse {
  email: string;
  expires_at: string;
}

export default function InvitePage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token') ?? '';

  const [tokenState, setTokenState] = useState<TokenState>('checking');
  const [inviteEmail, setInviteEmail] = useState('');
  const [expiresAt, setExpiresAt]   = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!token) { setTokenState('invalid'); return; }
    api.get<ValidateResponse>(`/api/invite/validate?token=${token}`)
      .then((r) => {
        setInviteEmail(r.data.email);
        setExpiresAt(r.data.expires_at);
        setTokenState('valid');
      })
      .catch((err) => {
        const msg: string = err?.response?.data?.error ?? '';
        if (msg.includes('used'))    setTokenState('used');
        else if (msg.includes('expired')) setTokenState('expired');
        else setTokenState('invalid');
      });
  }, [token]);

  async function handleAccept() {
    if (password.length < 8) return;
    setLoading(true);
    setError('');

    // Backend creates a confirmed Supabase user (skips email verification).
    // Works for both brand-new and previously-invited users.
    try {
      await api.post('/api/invite/signup', { token, password });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to create account. The invite link may have expired.');
      setLoading(false);
      return;
    }

    // Now sign in with the confirmed credentials
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: inviteEmail, password });
    if (signInErr) { setError(signInErr.message); setLoading(false); return; }

    navigate('/complete-profile');
  }

  function hoursLeft() {
    if (!expiresAt) return '';
    const h = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3_600_000));
    return `expires in ${h}h`;
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (tokenState === 'checking') {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'fa-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  // ── Invalid / used / expired ─────────────────────────────────────────────
  if (tokenState !== 'valid') {
    const msgs: Record<string, { title: string; body: string }> = {
      invalid:  { title: 'Invalid invite link', body: "This token doesn't exist. Check the URL or ask an admin to resend." },
      used:     { title: 'Invite already used',  body: "This link has already been consumed. If that wasn't you, contact an admin." },
      expired:  { title: 'Invite expired',       body: 'Tokens are valid for 72 hours. Ask an admin to generate a new one.' },
    };
    const m = msgs[tokenState] ?? msgs.invalid;
    return (
      <AuthShell title={m.title} sub={m.body} foot={<span style={{ color: T.accentText, cursor: 'pointer' }} onClick={() => navigate('/login')}>Go to login</span>}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(242,101,79,0.12)', color: T.loss }}>
            <Icon name="ban" size={26} />
          </div>
        </div>
        <Btn kind="ghost" full onClick={() => navigate('/login')}>Back to login</Btn>
      </AuthShell>
    );
  }

  // ── Valid token ──────────────────────────────────────────────────────────
  return (
    <AuthShell
      title="You're invited"
      sub="This invitation is locked to your email. Set a password to finish."
      foot={<span style={{ color: T.text3 }}>Tokens expire 72 hours after creation.</span>}
    >
      {/* Token validity card */}
      <div style={{
        marginBottom: 18, padding: '12px 14px', borderRadius: 10,
        background: T.surface2, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(69,212,131,0.12)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={17} style={{ color: T.gain }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 600, color: T.text }}>Invitation valid</div>
          <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
            token {token.slice(0, 4)}…{token.slice(-3)} · {hoursLeft()}
          </div>
        </div>
        <span style={{ fontFamily: T.fD, fontSize: 11, color: T.gain }}>● Active</span>
      </div>

      <Field
        label="Email"
        value={inviteEmail}
        onChange={() => {}}
        icon="mail"
        locked
        hint="Locked to the invited address — can't be changed."
      />
      <Field
        label="Create password"
        value={password}
        onChange={setPassword}
        icon="lock"
        type="password"
        hint="At least 8 characters."
      />

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
          {error}
        </div>
      )}

      <Btn
        kind="primary" full size="lg" iconR="arrow"
        disabled={loading || password.length < 8}
        onClick={handleAccept}
      >
        {loading ? 'Creating account…' : 'Accept invite & continue'}
      </Btn>
    </AuthShell>
  );
}
