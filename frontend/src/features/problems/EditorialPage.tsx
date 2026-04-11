import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge, RoleBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { useProblem, useEditorials, useCreateEditorial, useUpdateEditorial, useVoteEditorial } from './useProblemData';
import type { Editorial } from './useProblemData';

// ── iOS-safe clipboard ────────────────────────────────────────────────────
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:none;outline:none;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

const TOOLBAR_ITEMS = [
  { label: 'H',   insert: '## Heading\n' },
  { label: 'B',   insert: '**bold**' },
  { label: 'i',   insert: '_italic_' },
  { label: '"',   insert: '> quote\n' },
  { label: '</>', insert: '```cpp\n// code here\n```\n' },
  { label: '•',   insert: '- item\n' },
  { label: '🔗',  insert: '[link](url)' },
];

// ── Write / Edit editor ───────────────────────────────────────────────────
interface EditorProps {
  problemId: string;
  onCancel: () => void;
  isMobile: boolean;
  /** If provided, this is an update; if absent, it's a create */
  editorialId?: string;
  initialContent?: string;
}

function WriteEditor({ problemId, onCancel, isMobile, editorialId, initialContent }: EditorProps) {
  const DEFAULT_MD = '## Intuition\n\n## Approach\n\n## Complexity\n- **Time:** O(?)\n- **Space:** O(?)';
  const [md, setMd]               = useState(initialContent ?? DEFAULT_MD);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError]         = useState('');

  // Undo/redo stacks — refs avoid stale closure issues and don't trigger re-renders alone
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [, bump]  = useState(0);
  const canUndo   = undoStack.current.length > 0;
  const canRedo   = redoStack.current.length > 0;

  const { mutateAsync: create, isPending: creating } = useCreateEditorial(problemId);
  const { mutateAsync: update, isPending: updating } = useUpdateEditorial();
  const isPending = creating || updating;

  function pushHistory(oldVal: string) {
    undoStack.current.push(oldVal);
    if (undoStack.current.length > 120) undoStack.current.shift();
    redoStack.current = [];
    bump((n) => n + 1);
  }

  function handleChange(newVal: string) {
    pushHistory(md);
    setMd(newVal);
  }

  function insertAt(text: string) {
    pushHistory(md);
    setMd(md + '\n' + text);
    redoStack.current = []; // already cleared in pushHistory
  }

  function undo() {
    if (!undoStack.current.length) return;
    redoStack.current.push(md);
    setMd(undoStack.current.pop()!);
    bump((n) => n + 1);
  }

  function redo() {
    if (!redoStack.current.length) return;
    undoStack.current.push(md);
    setMd(redoStack.current.pop()!);
    bump((n) => n + 1);
  }

  async function handlePublish() {
    if (!md.trim()) return;
    setError('');
    try {
      if (editorialId) {
        await update({ editorialId, content_md: md });
      } else {
        await create(md);
      }
      onCancel();
    } catch {
      setError('Failed to publish — try again.');
    }
  }

  // ── Mobile: edit / preview toggle ──────────────────────────────────────
  if (isMobile && showPreview) {
    return (
      <div>
        <div style={{
          padding: '14px 16px', background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 12, marginBottom: 12, minHeight: 300, overflow: 'auto',
        }}>
          <MarkdownRenderer content={md} small />
        </div>
        {error && (
          <div style={{ marginBottom: 10, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="ghost" onClick={() => setShowPreview(false)}>← Edit</Btn>
          <Btn kind="primary" icon="check" disabled={isPending || !md.trim()} onClick={handlePublish}>
            {isPending ? 'Publishing…' : editorialId ? 'Save changes' : 'Publish'}
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px',
        background: T.surface2, border: `1px solid ${T.border}`,
        borderTopLeftRadius: 12, borderTopRightRadius: 12, flexWrap: 'wrap',
      }}>
        {/* Undo / Redo */}
        <button
          onClick={undo} disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center',
            fontFamily: T.fM, fontSize: 12, fontWeight: 600, cursor: canUndo ? 'pointer' : 'not-allowed',
            color: canUndo ? T.text2 : T.text3,
            background: T.surface3, border: 'none', opacity: canUndo ? 1 : 0.4,
          }}
        >↩</button>
        <button
          onClick={redo} disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center',
            fontFamily: T.fM, fontSize: 12, fontWeight: 600, cursor: canRedo ? 'pointer' : 'not-allowed',
            color: canRedo ? T.text2 : T.text3,
            background: T.surface3, border: 'none', opacity: canRedo ? 1 : 0.4,
          }}
        >↪</button>

        <span style={{ width: 1, height: 20, background: T.border, margin: '0 2px', flexShrink: 0 }} />

        {/* Formatting buttons */}
        {TOOLBAR_ITEMS.map((b) => (
          <button
            key={b.label}
            onClick={() => insertAt(b.insert)}
            style={{
              width: 30, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center',
              fontFamily: b.label === '</>' ? T.fM : T.fD, fontSize: 13, fontWeight: 600,
              color: T.text2, background: T.surface3, border: 'none', cursor: 'pointer',
            }}
          >{b.label}</button>
        ))}
        {!isMobile && (
          <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 10.5, color: T.text3 }}>
            Markdown · live preview →
          </span>
        )}
      </div>

      {/* Editor / preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        border: `1px solid ${T.border}`, borderTop: 'none',
        borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        overflow: 'hidden', minHeight: isMobile ? 320 : 520,
      }}>
        <textarea
          value={md}
          onChange={(e) => handleChange(e.target.value)}
          className="mono"
          style={{
            fontSize: 12.5, lineHeight: 1.7, color: T.text2,
            padding: '18px 20px', background: T.surface,
            borderRight: isMobile ? 'none' : `1px solid ${T.border}`,
            border: 'none', outline: 'none', resize: 'none', whiteSpace: 'pre-wrap',
            fontFamily: T.fM,
          }}
        />
        {!isMobile && (
          <div style={{ padding: '18px 22px', background: T.bg, overflow: 'auto' }}>
            <MarkdownRenderer content={md} small />
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
        {/* Mobile: show "View preview" instead of "Publish" */}
        {isMobile ? (
          <Btn kind="ghost" icon="search" disabled={!md.trim()} onClick={() => setShowPreview(true)}>
            View preview
          </Btn>
        ) : (
          <Btn kind="primary" icon="check" disabled={isPending || !md.trim()} onClick={handlePublish}>
            {isPending ? 'Publishing…' : editorialId ? 'Save changes' : 'Publish'}
          </Btn>
        )}
      </div>
    </div>
  );