import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { T } from '../../lib/tokens';
import type { Platform } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge, RoleBadge, SquadBadge, Verdict } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAppUser } from '../../hooks/useAppUser';
import { useAuth } from '../../hooks/useAuth';
import { TableRowSk } from '../../components/ui/Skeleton';
import { useProblems, useMySubmittedProblemIds, useProblemSubmissions } from './useProblemData';
import type { Problem, ProblemSubmission } from './useProblemData';
import { LogSolveModal } from './LogSolveModal';
import { AddProblemModal } from './AddProblemModal';

// ── Filter pills ─────────────────────────────────────────────────────────
function FilterPill({ children, active, icon, onClick }: {
  children: string; active?: boolean; icon?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
        fontFamily: T.fD, fontSize: 12.5, fontWeight: 500,
        color: active ? '#04201d' : T.text2,
        background: active ? T.accent : T.surface2,
        border: `1px solid ${active ? T.accent : T.border}`,
      }}
    >
      {icon && <Icon name={icon} size={14} />}{children}
    </button>
  );
}

// ── Tag chip ──────────────────────────────────────────────────────────────
function Tag({ children }: { children: string }) {
  return (
    <span style={{
      fontFamily: T.fM, fontSize: 10.5, color: T.text2,
      background: T.surface3, border: `1px solid ${T.border}`,
      borderRadius: 5, padding: '2px 7px',
    }}>{children}</span>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

// ── Accordion content — ALL member submissions ────────────────────────────
function ProblemAccordion({ problem, myUserId }: { problem: Problem; myUserId: string }) {
  const navigate = useNavigate();
  const { data: submissions = [], isLoading } = useProblemSubmissions(problem.id);
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  return (
    <div style={{ padding: isMobile ? '2px 10px 14px 10px' : '2px 18px 18px 52px' }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 11, overflow: 'hidden' }}>
        {/* Accordion header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: `1px solid ${T.borderSoft}`,
        }}>
          <span style={{ fontFamily: T.fM, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>
            {isLoading ? 'Loading…' : `${submissions.length} accepted submission${submissions.length !== 1 ? 's' : ''}`}
          </span>
          <a
            href={problem.external_link}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: T.fD, fontSize: 12, fontWeight: 600, color: T.accentText, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            Open problem <Icon name="external" size={12} />
          </a>
        </div>

        {/* Submission rows — every member */}
        {submissions.length === 0 && !isLoading && (
          <div style={{ padding: '20px', textAlign: 'center', fontFamily: T.fB, fontSize: 13, color: T.text3 }}>
            No submissions yet.
          </div>
        )}
        {submissions.map((s: ProblemSubmission, i: number) => {
          const isMe = s.user?.id === myUserId;
          return (
            <div
              key={s.id}
              style={{
                padding: '10px 14px',
                borderTop: i ? `1px solid ${T.borderSoft}` : 'none',
                background: isMe ? 'rgba(37,214,193,0.04)' : 'transparent',
              }}
            >
              {isMobile ? (
                // Mobile: two-row card
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar name={s.user?.full_name ?? '?'} size={26} />
                    <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.user?.full_name ?? 'Unknown'}
                      {isMe && <span style={{ color: T.accentText, fontWeight: 400 }}> · you</span>}
                    </span>
                    <Verdict>AC</Verdict>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {s.user?.role && <RoleBadge role={s.user.role as import('../../lib/tokens').Role} size="sm" />}
                    {s.user?.squad_name && <SquadBadge squad={s.user.squad_name} size="sm" />}
                    <span className="mono" style={{ fontSize: 10.5, color: T.text3 }}>{s.language}</span>
                    <span style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3 }}>
                      {relTime(s.submitted_at)}
                    </span>
                    <div style={{ marginLeft: 'auto' }}>
                      <Btn kind="solid" size="sm" icon="problems" onClick={() => navigate(`/submissions/${s.id}`)}>
                        View code
                      </Btn>
                    </div>
                  </div>
                </>
              ) : (
                // Desktop: single row
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={s.user?.full_name ?? '?'} size={26} />
                  <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.user?.full_name ?? 'Unknown'}
                    {isMe && <span style={{ color: T.accentText, fontWeight: 400 }}> · you</span>}
                  </span>
                  {s.user?.role && <RoleBadge role={s.user.role as import('../../lib/tokens').Role} size="sm" />}
                  {s.user?.squad_name && <SquadBadge squad={s.user.squad_name} size="sm" />}
                  <Verdict>AC</Verdict>
                  <span className="mono" style={{ fontSize: 11, color: T.text2, marginLeft: 'auto', flexShrink: 0 }}>{s.language}</span>
                  <span style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3, width: 78, textAlign: 'right', flexShrink: 0 }}>
                    {relTime(s.submitted_at)}
                  </span>
                  <Btn kind="solid" size="sm" icon="problems" onClick={() => navigate(`/submissions/${s.id}`)}>
                    View code
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Problem row ───────────────────────────────────────────────────────────
function ProblemRow({
  problem, open, onToggle, solved, myUserId, onSubmit,
}: {
  problem: Problem; open: boolean; onToggle: () => void; solved: boolean; myUserId: string;
  onSubmit: (p: Problem) => void;
}) {
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  return (
    <div style={{ borderTop: `1px solid ${T.borderSoft}`, background: open ? 'rgba(37,214,193,0.03)' : 'transparent' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center',
          gap: isMobile ? 8 : 14,
          padding: isMobile ? '10px 12px' : '13px 18px',
          cursor: 'pointer',
        }}
      >
        {/* Solved status */}
        <div style={{ width: 18, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {solved
            ? <span style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(69,212,131,0.15)', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={13} style={{ color: T.gain }} />
              </span>
            : <span style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${T.border}` }} />}
        </div>

        <PlatformBadge p={problem.platform} size="sm" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fD, fontSize: isMobile ? 13 : 14, fontWeight: 500, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {problem.name}
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: T.text3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {problem.external_id}
          </div>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
            {problem.tags.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>)}
          </div>
        )}

        {/* Per-problem actions — stop propagation so row toggle isn't triggered */}
        <div
          style={{ display: 'flex', gap: isMobile ? 4 : 5, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Btn kind="accentGhost" size="sm" icon="plus" onClick={() => onSubmit(problem)}>
            {isMobile ? '' : 'Submit'}
          </Btn>
          <Btn kind="solid" size="sm" icon="book" onClick={() => navigate(`/problems/${problem.id}/editorials`)}>
            {isMobile ? '' : 'Editorial'}
          </Btn>
        </div>

        <Icon
          name="chevronD"
          size={16}
          style={{ color: T.text3, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
        />
      </div>
      {open && <ProblemAccordion problem={problem} myUserId={myUserId} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
const PLATFORMS: Array<Platform | 'ALL'> = ['ALL', 'LEETCODE', 'CODEFORCES', 'ATCODER', 'HACKERRANK', 'GFG', 'OTHER'];
const PLAT_LABELS: Record<string, string> = {
  ALL: 'All', LEETCODE: 'LeetCode', CODEFORCES: 'Codeforces', ATCODER: 'AtCoder',
  HACKERRANK: 'HackerRank', GFG: 'GeeksForGeeks', OTHER: 'Other',
};

export default function ProblemsPage() {
  const { user } = useAuth();
  const appUser = useAppUser();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showUnsolvedOnly, setShowUnsolvedOnly] = useState(false);
  const [openId, setOpenId]     = useState<string | null>(null);
  const [page, setPage]         = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logPrefill, setLogPrefill]     = useState<{ url: string; name: string; platform: import('../../lib/tokens').Platform } | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);

  const canAddProblem = ['SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN'].includes(appUser.role);

  function openSubmitFor(p: Problem) {
    setLogPrefill({ url: p.external_link, name: p.name, platform: p.platform });
    setShowLogModal(true);
  }

  const PAGE_SIZE = 20;
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  const { data, isLoading } = useProblems({ platform, search: debouncedSearch, page, pageSize: PAGE_SIZE });
  const { data: solvedIds = new Set<string>() } = useMySubmittedProblemIds(user?.id);

  const problems = data?.problems ?? [];
  const total    = data?.total ?? 0;

  // Debounce search
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 300);
  }, []);

  const displayed = showUnsolvedOnly ? problems.filter((p) => !solvedIds.has(p.id)) : problems;

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  if (appUser.isLoading) return null;

  return (
    <>
      <AppShell
        title="Problems"
        crumbs="Hub / Problems"
        userId={appUser.id}
        role={appUser.role}
        userName={appUser.fullName}
        squadName={appUser.squadName}
        headerRight={
          <div style={{ display: 'flex', gap: 8 }}>
            {canAddProblem && (
              <Btn kind="ghost" size="sm" icon="plus" onClick={() => setShowAddModal(true)}>
                {isMobile ? 'Add' : 'Add problem'}
              </Btn>
            )}
            <Btn kind="accentGhost" size="sm" icon="plus" onClick={() => { setLogPrefill(undefined); setShowLogModal(true); }}>
              {isMobile ? 'Log' : 'Log a solve'}
            </Btn>
          </div>
        }
      >
        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '9px 13px', width: 280,
          }}>
            <Icon name="search" size={16} style={{ color: T.text3 }} />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search problems or tags…"
              style={{ fontFamily: T.fB, fontSize: 13, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
            />
          </div>

          <span style={{ width: 1, height: 24, background: T.border }} />

          {/* Platform pills */}
          {PLATFORMS.map((p) => (
            <FilterPill key={p} active={platform === p} onClick={() => { setPlatform(p); setPage(0); }}>
              {PLAT_LABELS[p]}
            </FilterPill>
          ))}

          <span style={{ flex: 1 }} />

          <FilterPill active={showUnsolvedOnly} icon="check" onClick={() => setShowUnsolvedOnly((v) => !v)}>
            Unsolved
          </FilterPill>
        </div>

        {/* Table */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 18px', background: T.surface3,
          }}>
            <span style={{ width: 20 }} />
            <span style={{ width: 52 }} />
            <span style={{ flex: 1, fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>
              Problem
            </span>
            {!isMobile && (
              <span style={{ fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>
                Tags
              </span>
            )}
            <span style={{ width: 16 }} />
          </div>

          {isLoading && [1,2,3,4,5,6].map((i) => <TableRowSk key={i} />)}

          {!isLoading && displayed.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
              No problems found.
            </div>
          )}

          {displayed.map((pr) => (
            <ProblemRow
              key={pr.id}
              problem={pr}
              open={openId === pr.id}
              onToggle={() => toggleOpen(pr.id)}
              solved={solvedIds.has(pr.id)}
              myUserId={appUser.id}
              onSubmit={openSubmitFor}
            />
          ))}
        </Card>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontFamily: T.fM, fontSize: 11.5, color: T.text3 }}>
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} problems
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Btn>
            <Btn kind="solid" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>Next</Btn>
          </div>
        </div>
      </AppShell>

      {showLogModal && (
        <LogSolveModal
          onClose={() => { setShowLogModal(false); setLogPrefill(undefined); }}
          prefill={logPrefill}
        />
      )}
      {showAddModal && <AddProblemModal onClose={() => setShowAddModal(false)} />}
    </>
  );
}
