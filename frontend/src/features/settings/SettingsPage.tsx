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
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      scroll
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* Connection status card */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 11, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              background: hasKey ? 'rgba(69,212,131,0.12)' : T.surface3,
              color: hasKey ? T.gain : T.text3,
            }}>
              <Icon name="bolt" size={22} fill={hasKey ? T.gain : undefined} />
            </div>

            {/* Description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontFamily: T.fD, fontSize: 16, fontWeight: 600, color: T.text }}>
                  Browser extension
                </h2>
                {!keyLoading && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: T.fM, fontSize: 11, fontWeight: 600,
                    color: hasKey ? T.gain : T.text3,
                    background: hasKey ? 'rgba(69,212,131,0.12)' : T.surface3,
                    border: `1px solid ${hasKey ? 'rgba(69,212,131,0.35)' : T.border}`,
                    borderRadius: 7, padding: '3px 9px', flexShrink: 0,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor' }} />
                    {hasKey ? 'Connected' : 'Not connected'}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, marginTop: 6, lineHeight: 1.55 }}>
                Auto-captures accepted submissions from LeetCode &amp; Codeforces. AtCoder &amp; Other are logged manually.
              </div>
              {/* Platform badges — below description on mobile, inline on desktop */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <PlatformBadge p="LEETCODE" />
                <PlatformBadge p="CODEFORCES" />
              </div>
            </div>
          </div>
        </Card>

        {/* API key section */}
        <Kicker style={{ marginBottom: 11 }}>Personal API key</Kicker>
        <Card style={{ marginBottom: 14 }}>

          {/* Raw key — shown once immediately after generation */}
          {rawKey && (
            <div style={{ marginBottom: 16, padding: '14px 16px', background: T.accentGhost, border: `1px solid ${T.accentLine}`, borderRadius: 10 }}>
              <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 600, color: T.accentText, marginBottom: 8 }}>
                Your new API key — copy it now. It will not be shown again.
              </div>
              {/* Key display row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#0c0f14', border: `1px solid ${T.border}`,
                borderRadius: 8, padding: '10px 12px',
              }}>
                <Icon name="key" size={15} style={{ color: T.accent, flexShrink: 0 }} />
                <span className="mono" style={{
                  fontSize: isMobile ? 11 : 12.5,
                  color: T.text, flex: 1, minWidth: 0,
                  wordBreak: 'break-all', lineHeight: 1.6,
                }}>
                  {revealed ? rawKey : `${rawKey.slice(0, 12)}${'•'.repeat(20)}${rawKey.slice(-3)}`}
                </span>
              </div>
              {/* Actions below the key box on mobile, or inline on desktop */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <Btn kind="ghost" size="sm" onClick={() => setRevealed((v) => !v)}>
                  {revealed ? 'Hide' : 'Reveal'}
                </Btn>
                <Btn
                  kind="accentGhost"
                  size="sm"
                  icon={copied ? 'check' : copyFailed ? 'ban' : 'copy'}
                  onClick={() => handleCopy(rawKey)}
                >
                  {copied ? 'Copied!' : copyFailed ? 'Copy failed' : 'Copy key'}
                </Btn>
              </div>
            </div>
          )}

          {/* Masked existing key display */}
          {!rawKey && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', background: '#0c0f14',
                border: `1px solid ${T.border}`, borderRadius: 10,
              }}>
                <Icon name="key" size={16} style={{ color: hasKey ? T.accent : T.text3, flexShrink: 0 }} />
                <span className="mono" style={{
                  fontSize: 13, color: hasKey ? T.text : T.text3,
                  flex: 1, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {hasKey ? 'fak_live_••••••••••••••••••••••••••••••••' : 'No API key generated yet'}
                </span>
              </div>
              {/* Key is hashed server-side — raw value not recoverable.
                  Direct the user to regenerate if they need to copy it. */}
              {hasKey && (
                <div style={{ marginTop: 8, fontFamily: T.fB, fontSize: 12, color: T.text3, lineHeight: 1.5 }}>
                  The key is stored as a hash and cannot be retrieved. Use <strong style={{ color: T.text2 }}>Regenerate key</strong> below to get a new copyable value.
                </div>
              )}
            </>
          )}

          {/* Warning */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 9,
            marginTop: 14, padding: '11px 14px', borderRadius: 10,
            background: T.warnGhost, border: '1px solid rgba(243,181,60,0.35)',
          }}>
            <Icon name="lock" size={15} style={{ color: T.warn, marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontFamily: T.fB, fontSize: 12.5, color: T.text2, lineHeight: 1.55, flex: 1 }}>
              The raw key is shown <strong style={{ color: T.warn }}>once</strong> on generation — we store only a SHA-256 hash. If you lose it, regenerate; the old key stops working immediately.
            </span>
          </div>

          {copyFailed && !rawKey && (
            <div style={{ marginTop: 10, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
              Clipboard access denied — please copy the key manually from the text above.
            </div>
          )}
          {genError && <div style={{ marginTop: 10, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>{genError}</div>}
          {revError && <div style={{ marginTop: 10, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>{revError}</div>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn kind="accentGhost" icon="key" disabled={generating} onClick={handleGenerate}>
              {generating ? 'Generating…' : hasKey ? 'Regenerate key' : 'Generate key'}
            </Btn>
            {hasKey && !revokeConfirm && (
              <Btn kind="danger" icon="ban" onClick={() => setRevokeConfirm(true)}>Revoke</Btn>
            )}
            {hasKey && revokeConfirm && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
                  Revoke and disconnect the extension?
                </span>
                <Btn kind="danger" disabled={revoking} onClick={handleRevoke}>
                  {revoking ? 'Revoking…' : 'Yes, revoke'}
                </Btn>
                <Btn kind="ghost" onClick={() => setRevokeConfirm(false)}>Cancel</Btn>
              </div>
            )}
            {hasKey && !revokeConfirm && (
              <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
                Key is active · submissions captured automatically
              </span>
            )}
          </div>
        </Card>

        {/* Setup steps */}
        <Kicker style={{ margin: '22px 0 13px' }}>Connect the extension</Kicker>
        <Card>
          <Step n={1} title="Install the extension">
            Add Focus ASTU CP Hub from the Chrome Web Store (or load unpacked during development).
          </Step>
          <Step n={2} title="Generate your API key">
            Use the section above — your key authenticates the extension as you.
          </Step>
          <Step n={3} title="Paste it into the popup">
            Open the extension popup and paste the key. It's stored locally in your browser.
          </Step>
          <Step n={4} title="You're connected" last>
            The popup shows a green Connected badge. Accepted solutions on LeetCode and Codeforces now post automatically.
          </Step>
        </Card>
      </div>
    </AppShell>
  );
}
