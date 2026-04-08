import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { T } from '../../lib/tokens';
import type { Platform } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge } from '../../components/ui/Badge';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { TableRowSk } from '../../components/ui/Skeleton';

interface ProblemWithEditorials {
  id: string;
  name: string;
  platform: Platform;
  external_id: string;
  editorial_count: number;
  last_editorial_at: string | null;
}

function useProblemsWithEditorials() {
  return useQuery({
    queryKey: ['problems-with-editorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('problems')
        .select('id, name, platform, external_id, editorials(id, created_at)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((p: Record<string, unknown>) => {
        const eds = (p.editorials as Array<{ id: string; created_at: string }>) ?? [];
        const last = eds.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? null;
        return {
          id: p.id,
          name: p.name,
          platform: p.platform,
          external_id: p.external_id,
          editorial_count: eds.length,
          last_editorial_at: last,
        } as ProblemWithEditorials;
      }).sort((a, b) => b.editorial_count - a.editorial_count);
    },
    staleTime: 60_000,
  });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

const PLATFORMS: Array<Platform | 'ALL'> = ['ALL', 'LEETCODE', 'CODEFORCES', 'ATCODER', 'HACKERRANK', 'GFG', 'OTHER'];
const PLAT_SHORT: Record<string, string> = { ALL: 'All', LEETCODE: 'LC', CODEFORCES: 'CF', ATCODER: 'AC', HACKERRANK: 'HR', GFG: 'GFG', OTHER: '··' };

export default function EditorialsListPage() {
  const navigate   = useNavigate();
  const appUser    = useAppUser();
  const w          = useWindowWidth();
  const isMobile   = w < BREAKPOINTS.tablet;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch]         = useState('');
  const [dSearch, setDSearch]       = useState('');
  const [platform, setPlatform]     = useState<Platform | 'ALL'>('ALL');
  const [showWithOnly, setShowWithOnly] = useState(false);

  const { data: problems = [], isLoading } = useProblemsWithEditorials();

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDSearch(val), 250);
  }, []);

  const displayed = problems.filter((p) => {
    if (platform !== 'ALL' && p.platform !== platform) return false;
    if (showWithOnly && p.editorial_count === 0) return false;
    if (dSearch.trim()) {
      const q = dSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.external_id.toLowerCase().includes(q);
    }
    return true;
  });

  if (appUser.isLoading) return null;

  return (
    <AppShell
      title="Editorials"
      crumbs="Hub / Editorials"
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      scroll
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '9px 13px',
            flex: isMobile ? '1 1 100%' : '0 0 240px',
          }}>
            <Icon name="search" size={15} style={{ color: T.text3 }} />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search problems…"
              style={{ fontFamily: T.fB, fontSize: 13, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
            />
          </div>

          {/* Platform pills */}
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              style={{
                padding: '7px 11px', borderRadius: 8, cursor: 'pointer',
                fontFamily: T.fD, fontSize: 12, fontWeight: 500,
                color: platform === p ? '#04201d' : T.text2,
                background: platform === p ? T.accent : T.surface2,
                border: `1px solid ${platform === p ? T.accent : T.border}`,
              }}
            >{isMobile ? PLAT_SHORT[p] : p === 'ALL' ? 'All' : PLAT_SHORT[p]}</button>
          ))}

          {/* Has editorials filter */}
          <button
            onClick={() => setShowWithOnly((v) => !v)}
            style={{
              padding: '7px 11px', borderRadius: 8, cursor: 'pointer',
              fontFamily: T.fD, fontSize: 12, fontWeight: 500,
              color: showWithOnly ? '#04201d' : T.text2,
              background: showWithOnly ? T.accent : T.surface2,
              border: `1px solid ${showWithOnly ? T.accent : T.border}`,
            }}
          >
            Has editorials
          </button>
        </div>

        {/* Table header */}
        {!isMobile && (
          <div style={{
            display: 'grid', gridTemplateColumns: '52px 1fr 100px 90px',
            padding: '8px 18px', background: T.surface3, border: `1px solid ${T.border}`,
            borderRadius: '10px 10px 0 0',
          }}>
            {['', 'Problem', 'Editorials', 'Last'].map((col) => (
              <span key={col} style={{ fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>
                {col}
              </span>
            ))}
          </div>
        )}

        {/* Rows */}
        <Card pad={0} style={{ overflow: 'hidden', borderTopLeftRadius: isMobile ? undefined : 0, borderTopRightRadius: isMobile ? undefined : 0 }}>
          {isLoading && [1, 2, 3, 4, 5, 6].map((i) => <TableRowSk key={i} />)}

          {!isLoading && displayed.length === 0 && (
            <div style={{ padding: '36px 20px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
              No problems match your filters.
            </div>
          )}

          {displayed.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => navigate(`/problems/${p.id}/editorials`)}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr auto' : '52px 1fr 100px 90px',
                alignItems: 'center',
                padding: isMobile ? '12px 16px' : '12px 18px',
                borderTop: idx > 0 ? `1px solid ${T.borderSoft}` : 'none',
                cursor: 'pointer',
                gap: isMobile ? 12 : 0,
              }}
            >
              {!isMobile && <PlatformBadge p={p.platform} size="sm" />}

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isMobile && <PlatformBadge p={p.platform} size="sm" />}
                  <span style={{ fontFamily: T.fD, fontSize: 13.5, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>{p.external_id}</div>
              </div>

              {/* Editorial count badge */}
              <div style={{ textAlign: isMobile ? 'right' : 'left' }}>
                {p.editorial_count > 0 ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: T.fM, fontSize: 11.5, fontWeight: 600,
                    color: T.accentText, background: T.accentGhost,
                    border: `1px solid ${T.accentLine}`, borderRadius: 6,
                    padding: '2px 8px',
                  }}>
                    <Icon name="book" size={11} />
                    {p.editorial_count}
                  </span>
                ) : (
                  <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>—</span>
                )}
              </div>

              {!isMobile && (
                <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
                  {p.last_editorial_at ? relTime(p.last_editorial_at) : '—'}
                </div>
              )}
            </div>
          ))}
        </Card>

        <div style={{ marginTop: 12, fontFamily: T.fM, fontSize: 11.5, color: T.text3 }}>
          {displayed.length} problem{displayed.length !== 1 ? 's' : ''} shown
        </div>
      </div>
    </AppShell>
  );
}
