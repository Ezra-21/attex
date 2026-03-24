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
