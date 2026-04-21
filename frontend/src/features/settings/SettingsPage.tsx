import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card, Kicker } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge } from '../../components/ui/Badge';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// ── API key hooks ─────────────────────────────────────────────────────────
function useHasApiKey(userId: string | undefined) {
  return useQuery({
    queryKey: ['api-key-exists', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from('users')
        .select('api_key_hash')
        .eq('id', userId)
        .single();
      return !!data?.api_key_hash;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

function useGenerateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ api_key: string }>('/api/users/me/api-key'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-key-exists'] }),
  });
}

function useRevokeKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/api/users/me/api-key'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-key-exists'] }),
  });
}

// ── Clipboard helper — Clipboard API with iOS-safe execCommand fallback ──
async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API — available in secure contexts (HTTPS / localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied — fall through to legacy method
    }
  }
  // Legacy fallback — works on iOS and non-HTTPS
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');                       // prevents mobile keyboard popup
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:none;outline:none;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);                  // required for iOS
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ── Setup step ────────────────────────────────────────────────────────────
function Step({ n, title, children, last }: { n: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 14, paddingBottom: last ? 0 : 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{
          width: 26, height: 26, borderRadius: 13, flexShrink: 0,
          display: 'grid', placeItems: 'center',
          fontFamily: T.fD, fontSize: 12, fontWeight: 700,
          color: T.accent, background: T.accentGhost, border: `1px solid ${T.accentLine}`,
        }}>
          {n}
        </span>
        {!last && <span style={{ flex: 1, width: 2, background: T.border, marginTop: 6 }} />}
      </div>
      <div style={{ paddingTop: 2 }}>
        <div style={{ fontFamily: T.fD, fontSize: 13.5, fontWeight: 600, color: T.text }}>{title}</div>
        <div style={{ fontFamily: T.fB, fontSize: 12.5, color: T.text2, lineHeight: 1.55, marginTop: 3 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const appUser = useAppUser();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  const [rawKey, setRawKey]               = useState<string | null>(null);
  const [revealed, setRevealed]           = useState(false);
  const [copied, setCopied]               = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [genError, setGenError]           = useState('');
  const [revError, setRevError]           = useState('');
  const [copyFailed, setCopyFailed]       = useState(false);

  const { data: hasKey, isLoading: keyLoading } = useHasApiKey(appUser.id || undefined);
  const { mutateAsync: generate, isPending: generating } = useGenerateKey();
  const { mutateAsync: revoke,   isPending: revoking }   = useRevokeKey();

  if (appUser.isLoading) return null;

  async function handleGenerate() {
    setGenError(''); setRawKey(null); setRevealed(false); setCopied(false);
    try {
      const res = await generate();
      setRawKey(res.data.api_key);
    } catch {
      setGenError('Failed to generate key — try again.');
    }
  }

  async function handleRevoke() {
    setRevError('');
    try {
      await revoke();
      setRawKey(null); setRevealed(false); setRevokeConfirm(false);
    } catch {
      setRevError('Failed to revoke — try again.');
    }
  }

  async function handleCopy(text: string) {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 1800);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  }

  return (
    <AppShell
      title="Settings"
      crumbs="Hub / Settings / Extension"