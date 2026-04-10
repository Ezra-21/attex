import { useState } from 'react';
import { T } from '../../lib/tokens';
import { PLAT } from '../../lib/tokens';
import type { Platform } from '../../lib/tokens';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge } from '../../components/ui/Badge';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { usePreviewProblem, useAddProblem } from './useProblemData';
import type { ProblemPreview } from './useProblemData';

interface Props { onClose: () => void }

type Step = 'url' | 'confirm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export function AddProblemModal({ onClose }: Props) {
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  const [step, setStep]       = useState<Step>('url');
  const [url, setUrl]         = useState('');
  const [preview, setPreview] = useState<ProblemPreview | null>(null);
  const [name, setName]       = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [urlError, setUrlError]     = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess]       = useState(false);

  const { mutateAsync: fetchPreview, isPending: previewing } = usePreviewProblem();
  const { mutateAsync: addProblem, isPending: adding }       = useAddProblem();

  async function handleLookup() {
    if (!url.trim()) { setUrlError('Paste a problem URL.'); return; }
    setUrlError('');
    try {
      const res = await fetchPreview(url.trim());
      const data = res.data;
      setPreview(data);
      setName(data.name);
      setTagsStr(data.tags.join(', '));
      setStep('confirm');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not look up that URL — check it and try again.';
      setUrlError(msg);
    }
  }

  async function handleAdd() {
    if (!preview) return;
    if (!name.trim()) { setSubmitError('Problem name is required.'); return; }
    setSubmitError('');
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await addProblem({
        platform:      preview.platform as Platform,
        external_id:   preview.external_id,
        external_link: preview.external_link,
        name:          name.trim(),
        tags,
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      if (status === 409) {
        setSubmitError('This problem is already in the library.');
      } else {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
        setSubmitError(msg || 'Failed to add problem — try again.');
      }
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 520,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: isMobile ? '16px 16px 0 0' : 16,
        padding: isMobile ? '24px 20px 32px' : 28, zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'confirm' && (
              <button
                onClick={() => { setStep('url'); setPreview(null); setSubmitError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, display: 'grid', placeItems: 'center', padding: 4 }}
              >
                <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            <h2 style={{ fontFamily: T.fD, fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>
              {step === 'url' ? 'Add problem' : 'Confirm details'}
            </h2>
          </div>