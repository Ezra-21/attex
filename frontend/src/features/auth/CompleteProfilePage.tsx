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
      title="Complete your profile"
      sub="Required before you can access the hub. You can edit handles later in Settings."
    >
      {/* Required fields */}
      <Field
        label="Full name" value={form.full_name} onChange={set('full_name')}
        icon="profile" required placeholder="Abel Tadesse"
      />
      <Field
        label="Telegram handle" value={form.telegram_handle} onChange={set('telegram_handle')}
        mono required placeholder="abel_t"
        hint="Required — how your squad reaches you (no @)."
        right={<span style={{ fontFamily: T.fM, fontSize: 10, color: T.loss }}>REQUIRED</span>}
      />

      {/* Platform handles — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field
          label="Codeforces handle" value={form.codeforces_handle} onChange={set('codeforces_handle')}
          mono required placeholder="tourist"
          hint="Required — used to match contest standings."
          right={<span style={{ fontFamily: T.fM, fontSize: 10, color: T.loss }}>REQUIRED</span>}
        />
        <Field
          label="LeetCode handle" value={form.leetcode_handle} onChange={set('leetcode_handle')}
          mono placeholder="neal_wu"
          hint="Optional."
        />
      </div>

      <Field
        label="AtCoder handle" value={form.atcoder_handle} onChange={set('atcoder_handle')}
        mono placeholder="tourist"
        hint="Optional. AtCoder problems are logged manually."
      />

      {/* Optional extras */}
      <Field
        label="LinkedIn URL (optional)" value={form.linkedin_url} onChange={set('linkedin_url')}
        icon="link" placeholder="linkedin.com/in/…"
      />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2, marginBottom: 7 }}>
          Bio (optional)
        </label>
        <textarea
          value={form.bio}
          onChange={(e) => set('bio')(e.target.value)}
          placeholder="A short bio about yourself…"
          rows={3}
          style={{
            width: '100%', background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '11px 13px', resize: 'vertical',
            fontFamily: T.fB, fontSize: 14, color: T.text, outline: 'none',
            boxSizing: 'border-box', lineHeight: 1.5,
          }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
          {error}
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ marginTop: 2, accentColor: T.accent, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
        />
        <span style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
          I have read and agree to the{' '}
          <Link to="/terms" target="_blank" style={{ color: T.accentText, textDecoration: 'none' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" target="_blank" style={{ color: T.accentText, textDecoration: 'none' }}>Privacy Policy</Link>.
        </span>
      </label>

      <Btn
        kind="primary" full size="lg" iconR="arrow"
        disabled={loading || !canSubmit}
        onClick={handleSubmit}
      >
        {loading ? 'Saving…' : 'Finish & enter the hub'}
      </Btn>
    </AuthShell>
  );
}
