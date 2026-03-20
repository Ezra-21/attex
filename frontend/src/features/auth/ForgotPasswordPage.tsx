import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { AuthShell, Field } from './AuthShell';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function handleSend() {
    if (!email.trim()) return;
    setState('sending');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setErrMsg(error.message); setState('error'); }
    else setState('sent');
  }

  if (state === 'sent') {
    return (
      <AuthShell title="Check your inbox" sub="A password reset link is on its way.">
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
              Click the link in the email to choose a new password. Check spam if it doesn't arrive.
            </div>
          </div>
        </div>
        <Btn kind="ghost" full style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
          Back to sign in
        </Btn>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password?"
      sub="Enter your email and we'll send you a reset link."
      foot={
        <span
          style={{ color: T.accentText, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => navigate('/login')}
        >
          Back to sign in
        </span>
      }
    >
      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="you@astu.edu.et"
        icon="mail"
        type="email"
      />

      {state === 'error' && (
        <div style={{
          marginBottom: 14, padding: '10px 13px', borderRadius: 9,
          background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)',
          fontFamily: T.fB, fontSize: 12.5, color: T.loss,
        }}>{errMsg}</div>
      )}

      <Btn
        kind="primary" full size="lg" iconR="arrow"
        disabled={state === 'sending' || !email.trim()}
        onClick={handleSend}
      >
        {state === 'sending' ? 'Sending…' : 'Send reset link'}
      </Btn>
    </AuthShell>
  );
}
