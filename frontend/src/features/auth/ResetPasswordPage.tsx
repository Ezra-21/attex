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