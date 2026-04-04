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