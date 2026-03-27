import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { AuthShell, Field } from './AuthShell';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';

type State = 'idle' | 'saving' | 'done' | 'error' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errMsg, setErrMsg] = useState('');

  // Supabase puts the access_token in the URL hash when the user clicks the
  // reset link. The JS client picks it up automatically and fires SIGNED_IN.
  // We just need to make sure the page is mounted before that exchange happens.
  useEffect(() => {
    // If there's no hash with an access_token, the link is missing or already used.
    const hash = window.location.hash;
    if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
      // Give Supabase a tick to process the URL before deciding it's invalid.
      const timer = setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) setState('invalid');
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleSave() {
    if (password.length < 8 || password !== confirm) return;
    setState('saving');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErrMsg(error.message); setState('error'); }
    else setState('done');
  }

  if (state === 'invalid') {
    return (
      <AuthShell title="Link expired or invalid" sub="This reset link has already been used or has expired. Request a new one.">
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 20,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(242,101,79,0.12)', color: T.loss }}>
            <Icon name="ban" size={26} />
          </div>
        </div>
        <Btn kind="primary" full onClick={() => navigate('/forgot-password')}>
          Request a new link
        </Btn>
        <Btn kind="ghost" full style={{ marginTop: 10 }} onClick={() => navigate('/login')}>
          Back to sign in
        </Btn>
      </AuthShell>
    );
  }

  if (state === 'done') {
    return (
      <AuthShell title="Password updated" sub="Your new password is set. You can now sign in.">
        <div style={{
          padding: '22px 20px', background: 'rgba(69,212,131,0.10)', border: '1px solid rgba(69,212,131,0.28)',
          borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20,
        }}>
          <Icon name="check" size={20} style={{ color: T.gain, marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontFamily: T.fB, fontSize: 13.5, color: T.text, lineHeight: 1.5 }}>
            Password changed successfully. Use it next time you sign in with password.
          </div>
        </div>
        <Btn kind="primary" full size="lg" iconR="arrow" onClick={() => navigate('/dashboard')}>
          Go to dashboard
        </Btn>
      </AuthShell>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <AuthShell
      title="Choose a new password"
      sub="Pick something strong — at least 8 characters."
    >
      <Field
        label="New password"
        value={password}
        onChange={setPassword}
        icon="lock"
        type="password"
        hint="At least 8 characters."
      />
      <Field
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        icon="lock"
        type="password"
        hint={mismatch ? 'Passwords do not match.' : undefined}
      />

      {mismatch && (
        <div style={{
          marginBottom: 14, padding: '10px 13px', borderRadius: 9,
          background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)',
          fontFamily: T.fB, fontSize: 12.5, color: T.loss,
        }}>Passwords do not match.</div>
      )}

      {state === 'error' && (
        <div style={{
          marginBottom: 14, padding: '10px 13px', borderRadius: 9,
          background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)',
          fontFamily: T.fB, fontSize: 12.5, color: T.loss,
        }}>{errMsg}</div>
      )}

      <Btn
        kind="primary" full size="lg" icon="key"
        disabled={state === 'saving' || password.length < 8 || password !== confirm}
        onClick={handleSave}
      >
        {state === 'saving' ? 'Saving…' : 'Set new password'}
      </Btn>
    </AuthShell>
  );
}
