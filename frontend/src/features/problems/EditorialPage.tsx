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
}

// ── Vote buttons ──────────────────────────────────────────────────────────
function VoteBar({ ed, onVote }: { ed: Editorial; onVote: (v: 1 | -1) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => onVote(1)}
        title="Upvote"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 9px', borderRadius: 7, cursor: 'pointer',
          fontFamily: T.fM, fontSize: 12, fontWeight: 600,
          background: ed.user_vote === 1 ? 'rgba(69,212,131,0.15)' : T.surface3,
          color: ed.user_vote === 1 ? T.gain : T.text3,
          border: `1px solid ${ed.user_vote === 1 ? 'rgba(69,212,131,0.4)' : T.border}`,
        }}
      >
        ▲
      </button>
      <span style={{ fontFamily: T.fM, fontSize: 12, fontWeight: 600, color: ed.score > 0 ? T.gain : ed.score < 0 ? T.loss : T.text3, minWidth: 16, textAlign: 'center' }}>
        {ed.score}
      </span>
      <button
        onClick={() => onVote(-1)}
        title="Downvote"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 9px', borderRadius: 7, cursor: 'pointer',
          fontFamily: T.fM, fontSize: 12, fontWeight: 600,
          background: ed.user_vote === -1 ? 'rgba(242,101,79,0.15)' : T.surface3,
          color: ed.user_vote === -1 ? T.loss : T.text3,
          border: `1px solid ${ed.user_vote === -1 ? 'rgba(242,101,79,0.4)' : T.border}`,
        }}
      >
        ▼
      </button>
    </div>
  );
}

// ── Editorial card ────────────────────────────────────────────────────────
function EditorialCard({
  ed, expanded, onToggle, myUserId, myRole, isMobile,
}: {
  ed: Editorial; expanded: boolean; onToggle: () => void;
  myUserId: string; myRole: string; isMobile: boolean;
}) {
  const [copied, setCopied]       = useState(false);
  const [editing, setEditing]     = useState(false);
  const { mutate: vote }          = useVoteEditorial();

  const isAuthor   = ed.author?.id === myUserId;
  const canEdit    = isAuthor || myRole === 'ADMIN' || myRole === 'SUPER_ADMIN';

  async function handleShare() {
    // Strip any existing hash and append this editorial's anchor
    const base = window.location.href.split('#')[0];
    const ok = await copyToClipboard(`${base}#editorial-${ed.id}`);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
  }

  function handleVote(v: 1 | -1) {
    vote({ editorialId: ed.id, value: v });
  }

  if (editing) {
    return (
      <div style={{ border: `1px solid ${T.accentLine}`, borderRadius: 12, padding: '16px 18px', background: 'rgba(37,214,193,0.03)' }}>
        <div style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 600, color: T.accentText, marginBottom: 14 }}>
          Editing editorial by {ed.author?.full_name}
        </div>
        <WriteEditor
          problemId="" // unused for update
          onCancel={() => setEditing(false)}
          isMobile={isMobile}
          editorialId={ed.id}
          initialContent={ed.content_md}
        />
      </div>
    );
  }

  return (
    <div id={`editorial-${ed.id}`} style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Clickable header row — author info only, no action buttons */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px',
          background: expanded ? T.surface2 : T.surface,
          cursor: 'pointer',
        }}
      >
        <Avatar name={ed.author?.full_name ?? '?'} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap', overflow: 'hidden' }}>
            <span style={{
              fontFamily: T.fD, fontSize: 13.5, fontWeight: 600, color: T.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {ed.author?.full_name ?? 'Unknown'}
            </span>
            {ed.author?.role && !isMobile && (
              <RoleBadge role={ed.author.role as import('../../lib/tokens').Role} size="sm" />
            )}
          </div>
          <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginTop: 2 }}>
            {isMobile && ed.author?.role && (
              <RoleBadge role={ed.author.role as import('../../lib/tokens').Role} size="sm" />
            )}
            {' '}Editorial · {relTime(ed.created_at)}
          </div>
        </div>

        {/* Desktop actions — inline in header */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <VoteBar ed={ed} onVote={handleVote} />
            {canEdit && (
              <Btn kind="ghost" size="sm" icon="settings" onClick={() => setEditing(true)}>Edit</Btn>
            )}
            <Btn kind="ghost" size="sm" icon={copied ? 'check' : 'copy'} onClick={handleShare}>
              {copied ? 'Copied!' : 'Share'}
            </Btn>
          </div>
        )}

        <Icon
          name="chevronD"
          size={15}
          style={{ color: T.text3, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0, marginLeft: 4 }}
        />
      </div>

      {/* Mobile action strip — vote, edit, share on their own row */}
      {isMobile && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: expanded ? T.surface2 : T.surface,
            borderTop: `1px solid ${T.borderSoft}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <VoteBar ed={ed} onVote={handleVote} />
          <span style={{ flex: 1 }} />
          {canEdit && (
            <Btn kind="ghost" size="sm" icon="settings" onClick={() => setEditing(true)} />
          )}
          <Btn kind="ghost" size="sm" icon={copied ? 'check' : 'copy'} onClick={handleShare}>
            {copied ? 'Copied!' : ''}
          </Btn>
        </div>
      )}

      {/* Content */}
      {expanded && (
        <div style={{ padding: '24px 24px 28px', borderTop: `1px solid ${T.borderSoft}` }}>
          <MarkdownRenderer content={ed.content_md} />
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function EditorialPage() {
  const { id: problemId } = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const appUser    = useAppUser();
  const w          = useWindowWidth();
  const isMobile   = w < BREAKPOINTS.tablet;

  const [writing, setWriting]       = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    // Pre-expand the editorial referenced in the URL hash on initial load
    const hash = window.location.hash;
    const match = hash.match(/^#editorial-(.+)$/);
    return match ? match[1] : null;
  });

  const { data: problem } = useProblem(problemId);
  // Backend returns editorials with score + user_vote already computed
  const { data: editorials = [], isLoading } = useEditorials(problemId);

  // Scroll to the anchored editorial once it appears in the DOM
  useEffect(() => {
    if (!expandedId) return;
    const el = document.getElementById(`editorial-${expandedId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [expandedId, editorials.length]);

  if (appUser.isLoading) return null;

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <AppShell
      title="Editorials"
      crumbs={`Problems${problem ? ` / ${problem.name}` : ''} / Editorials`}
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      scroll
    >
      <div style={{ maxWidth: writing ? 1000 : 780, margin: '0 auto' }}>

        {/* Mini-navbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Back button — use arrowL icon so text is not rotated */}
          <button
            onClick={() => navigate('/problems')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              fontFamily: T.fD, fontSize: 13, fontWeight: 500,
              color: T.text2, background: T.surface2, border: `1px solid ${T.border}`,
              flexShrink: 0,
            }}
          >
            <Icon name="arrowL" size={15} style={{ color: T.text3 }} />
            {!isMobile && 'Problems'}
          </button>

          {/* Problem info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {problem && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <PlatformBadge p={problem.platform} />
                <span style={{ fontFamily: T.fD, fontSize: isMobile ? 13.5 : 16, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {problem.name}
                </span>
                {!writing && !isMobile && (
                  <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
                    · {editorials.length} editorial{editorials.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {problem && !writing && (
              <Btn kind="ghost" size="sm" iconR="external" onClick={() => window.open(problem.external_link, '_blank')}>
                {!isMobile && 'Open problem'}
              </Btn>
            )}
            {!writing && (
              <Btn kind="accentGhost" size="sm" icon="plus" onClick={() => { setWriting(true); setExpandedId(null); }}>
                {isMobile ? 'Add' : 'Add editorial'}
              </Btn>
            )}
          </div>
        </div>

        {/* Write mode */}
        {writing && problemId && (
          <WriteEditor problemId={problemId} onCancel={() => setWriting(false)} isMobile={isMobile} />
        )}

        {/* List mode */}
        {!writing && (
          <>
            {isLoading && (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>Loading…</div>
            )}

            {!isLoading && editorials.length === 0 && (
              <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
                <Icon name="book" size={36} style={{ color: T.text3, marginBottom: 16 }} />
                <div style={{ fontFamily: T.fD, fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                  No editorials yet
                </div>
                <div style={{ fontFamily: T.fB, fontSize: 14, color: T.text2, marginBottom: 24 }}>
                  Be the first to explain this problem.
                </div>
                <Btn kind="accentGhost" icon="plus" onClick={() => setWriting(true)}>Write the first editorial</Btn>
              </Card>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {editorials.map((ed: Editorial) => (
                <EditorialCard
                  key={ed.id}
                  ed={ed}
                  expanded={expandedId === ed.id}
                  onToggle={() => toggleExpand(ed.id)}
                  myUserId={appUser.id}
                  myRole={appUser.role}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
