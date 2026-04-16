import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import type { Platform } from '../../lib/tokens';

// ── Problems list ────────────────────────────────────────────────────────
export interface Problem {
  id: string;
  name: string;
  platform: Platform;
  external_id: string;
  external_link: string;
  tags: string[];
  created_at: string;
}

export function useProblems(opts: {
  platform?: Platform | 'ALL';
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { platform = 'ALL', search = '', page = 0, pageSize = 20 } = opts;
  return useQuery({
    queryKey: ['problems', platform, search, page],
    queryFn: async () => {
      let q = supabase
        .from('problems')
        .select('id, name, platform, external_id, external_link, tags, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (platform !== 'ALL') q = q.eq('platform', platform);
      if (search.trim()) {
        q = q.or(`name.ilike.%${search.trim()}%,external_id.ilike.%${search.trim()}%,tags.cs.{${search.trim()}}`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { problems: (data ?? []) as Problem[], total: count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });
}

// ── Problem IDs the current user has solved (for Unsolved filter) ────────
export function useMySubmittedProblemIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-solved', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', userId);
      if (error) throw error;
      return new Set((data ?? []).map((r: { problem_id: string }) => r.problem_id));
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ── All submissions for one problem (loaded on accordion open) ───────────
export interface ProblemSubmission {
  id: string;
  language: string;
  source: string;
  submitted_at: string;
  user: { id: string; full_name: string; role: string; squad_name: string | null } | null;
}

export function useProblemSubmissions(problemId: string | null) {
  return useQuery({
    queryKey: ['problem-submissions', problemId],
    queryFn: async () => {
      if (!problemId) return [];
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id, language, source, submitted_at,
          user:users(id, full_name, role, squad:squads(name))
        `)
        .eq('problem_id', problemId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;

      return (data ?? []).map((s: Record<string, unknown>) => {
        const u = s.user as Record<string, unknown> | null;
        const squad = u?.squad as { name: string } | null;
        return {
          id: s.id,
          language: s.language,
          source: s.source,
          submitted_at: s.submitted_at,
          user: u ? {
            id: u.id as string,
            full_name: u.full_name as string,
            role: u.role as string,
            squad_name: squad?.name ?? null,
          } : null,
        } as ProblemSubmission;
      });
    },
    enabled: !!problemId,
    staleTime: 30_000,
  });
}

// ── Single submission ────────────────────────────────────────────────────
export interface FullSubmission {
  id: string;
  language: string;
  code: string;
  source: string;
  submitted_at: string;
  problem: { id: string; name: string; platform: Platform; external_id: string; external_link: string; tags: string[] } | null;
  user: { id: string; full_name: string; role: string; squad_name: string | null } | null;
}

export function useSubmission(id: string | undefined) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id, language, code, source, submitted_at,
          problem:problems(id, name, platform, external_id, external_link, tags),
          user:users(id, full_name, role, squad:squads(name))
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = data as any;
      const u = raw?.user ?? null;
      const squad = u?.squad ?? null;
      return {
        id: raw.id, language: raw.language, code: raw.code,
        source: raw.source, submitted_at: raw.submitted_at,
        problem: Array.isArray(raw.problem) ? raw.problem[0] ?? null : raw.problem,
        user: u ? { id: u.id, full_name: u.full_name, role: u.role, squad_name: (Array.isArray(squad) ? squad[0] : squad)?.name ?? null } : null,
      } as FullSubmission;
    },
    enabled: !!id,
  });
}

// ── Editorials ────────────────────────────────────────────────────────────
export interface Editorial {
  id: string;
  content_md: string;
  created_at: string;
  author: { id: string; full_name: string; role: string } | null;
  score: number;
  user_vote: number | null;
}

export function useEditorials(problemId: string | undefined) {
  return useQuery({
    queryKey: ['editorials', problemId],
    queryFn: async () => {
      if (!problemId) return [];
      // Use the backend API — bypasses Supabase RLS, correctly joins users + votes
      const res = await api.get<Editorial[]>(`/api/editorials?problem_id=${problemId}`);
      return res.data ?? [];
    },
    enabled: !!problemId,
  });
}

export function useCreateEditorial(problemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content_md: string) =>
      api.post('/api/editorials', { problem_id: problemId, content_md }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['editorials', problemId] }),
  });
}

export function useUpdateEditorial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ editorialId, content_md }: { editorialId: string; content_md: string }) =>
      api.put(`/api/editorials/${editorialId}`, { content_md }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['editorials'] }),
  });
}

export function useVoteEditorial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ editorialId, value }: { editorialId: string; value: 1 | -1 }) =>
      api.post(`/api/editorials/${editorialId}/vote`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['editorials'] }),
  });
}

// ── Problem detail (for breadcrumbs / editorial page) ────────────────────
export function useProblem(id: string | undefined) {
  return useQuery({
    queryKey: ['problem', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('problems')
        .select('id, name, platform, external_id, external_link, tags')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Problem;
    },
    enabled: !!id,
  });
}

// ── Log a solve (manual submission — problem must already exist) ─────────
export function useLogSolve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      problem_url: string;
      language: string;
      code: string;
    }) => api.post('/api/submissions', { ...payload, source: 'manual' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['my-solved'] });
      qc.invalidateQueries({ queryKey: ['submissions', 'recent'] });
    },
  });
}

// ── Problem preview from URL (squad lead+) ────────────────────────────────
export interface ProblemPreview {
  platform: Platform;
  external_id: string;
  external_link: string;
  name: string;
  tags: string[];
}

export function usePreviewProblem() {
  return useMutation({
    mutationFn: (url: string) =>
      api.get<ProblemPreview>(`/api/problems/preview?url=${encodeURIComponent(url)}`),
  });
}

// ── Add a problem to the library (squad lead+) ────────────────────────────
export function useAddProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      platform: Platform;
      external_id: string;
      external_link: string;
      name: string;
      tags: string[];
    }) => api.post('/api/problems', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problems'] }),
  });
}

// ── Language → file extension ────────────────────────────────────────────
// Implemented in the pure, unit-tested lib; re-exported here for consumers.
export { langToExt } from '../../lib/derive';
