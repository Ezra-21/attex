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