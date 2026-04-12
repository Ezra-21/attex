import { useState } from 'react';
import { T } from '../../lib/tokens';
import type { Platform } from '../../lib/tokens';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge } from '../../components/ui/Badge';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { useLogSolve } from './useProblemData';

const LANGUAGES = ['C++', 'C++17', 'C', 'Python', 'Python3', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Kotlin', 'Swift'];

interface Props {
  onClose: () => void;
  /** When provided, the problem is pre-selected and the URL field is locked */
  prefill?: { url: string; name: string; platform: Platform };
}

export function LogSolveModal({ onClose, prefill }: Props) {
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  const [url, setUrl]           = useState(prefill?.url ?? '');
  const [language, setLanguage] = useState('C++');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const { mutateAsync, isPending } = useLogSolve();

  async function handleSubmit() {
    if (!url.trim()) { setError('Paste the problem URL.'); return; }
    if (!code.trim()) { setError('Paste your accepted code.'); return; }
    setError('');
    try {
      await mutateAsync({ problem_url: url.trim(), language, code });
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('no problem found')) {
        setError(msg);
      } else {
        setError('Failed to log solve — check your connection and try again.');
      }
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 540,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: isMobile ? '16px 16px 0 0' : 16,
        padding: isMobile ? '24px 20px 32px' : 28, zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: T.fD, fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>Log a solve</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, display: 'grid', placeItems: 'center' }}>
            <Icon name="ban" size={18} />
          </button>
        </div>

        {/* Problem — locked when prefill provided, editable URL otherwise */}
        {prefill ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            padding: '10px 13px', background: T.surface2, border: `1px solid ${T.accentLine}`,
            borderRadius: 9,