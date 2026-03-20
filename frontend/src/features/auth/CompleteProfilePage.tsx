import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { T } from '../../lib/tokens';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { AuthShell, Field } from './AuthShell';
import { Btn } from '../../components/ui/Btn';

interface FormState {
  full_name: string;
  telegram_handle: string;
  codeforces_handle: string;
  leetcode_handle: string;
  atcoder_handle: string;
  linkedin_url: string;
  bio: string;
}

const EMPTY: FormState = {
  full_name: '',
  telegram_handle: '',
  codeforces_handle: '',
  leetcode_handle: '',
  atcoder_handle: '',
  linkedin_url: '',
  bio: '',
};

export default function CompleteProfilePage() {
  const [form, setForm]     = useState<FormState>(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  function set(key: keyof FormState) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  const canSubmit =
    form.full_name.trim().length > 0 &&
    form.telegram_handle.trim().length > 0 &&
    form.codeforces_handle.trim().length > 0 &&
    agreed;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/me/complete-profile', {
        full_name:         form.full_name.trim(),
        telegram_handle:   form.telegram_handle.trim().replace(/^@/, ''),
        codeforces_handle: form.codeforces_handle.trim(),
        leetcode_handle:   form.leetcode_handle.trim() || undefined,
        atcoder_handle:    form.atcoder_handle.trim() || undefined,
        linkedin_url:      form.linkedin_url.trim() || undefined,
        bio:               form.bio.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <AuthShell
      wide