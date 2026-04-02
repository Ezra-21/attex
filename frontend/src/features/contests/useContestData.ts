import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { bestRank, countAwaitingUpsolve, contestProblemLabels } from '../../lib/derive';

// ── Contest list ──────────────────────────────────────────────────────────
export interface Contest {
  id: string;
  name: string;
  platform: string;
  external_id: string;
  held_at: string;
  synced_at: string;
  squad_id?: string | null;
  squad_name?: string | null;
  participant_count?: number;
}

export function useContests() {
  return useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('id, name, platform, external_id, held_at, synced_at')
        .order('held_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contest[];
    },
    staleTime: 60_000,
  });
}

// ── My standings across all contests (for "your best rank" stat) ──────────
export function useMyContestStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-contest-stats', userId],
    queryFn: async () => {
      if (!userId) return { bestRank: null, awaitingUpsolve: 0 };
      const { data, error } = await supabase
        .from('contest_standings')
        .select('rank, upsolved_count, problems_solved')
        .eq('user_id', userId);
      if (error) throw error;
      const rows = data ?? [];
      return {
        bestRank: bestRank(rows.map((r: { rank: number }) => r.rank)),
        awaitingUpsolve: countAwaitingUpsolve(rows),
      };
    },
    enabled: !!userId,
    staleTime: 120_000,
  });
}

// ── Contest detail + standings ────────────────────────────────────────────
export interface StandingRow {
  id: string;
  rank: number;
  problems_solved: number;
  upsolved_count: number;
  penalty?: number | null;
  user_id: string;
  user_name: string;
  squad_name: string | null;
}

export interface ContestDetail extends Contest {
  standings: StandingRow[];
  problem_labels: string[];   // e.g. ['A','B','C','D','E']
}

export function useContestDetail(contestId: string | undefined) {
  return useQuery({
    queryKey: ['contest', contestId],
    queryFn: async () => {
      if (!contestId) return null;

      // Contest meta
      const { data: contest, error: ce } = await supabase
        .from('contests')
        .select('id, name, platform, external_id, held_at, synced_at')
        .eq('id', contestId)
        .single();
      if (ce) throw ce;

      // Standings (join user + squad)
      const { data: standings, error: se } = await supabase
        .from('contest_standings')
        .select(`
          id, rank, problems_solved, upsolved_count,
          user:users(id, full_name, squad:squads(name))
        `)
        .eq('contest_id', contestId)
        .order('rank', { ascending: true });
      if (se) throw se;

      const rows: StandingRow[] = (standings ?? []).map((s: Record<string, unknown>) => {
        const u = s.user as Record<string, unknown> | null;
        const sq = u?.squad as { name: string } | null;
        return {
          id:              s.id as string,
          rank:            s.rank as number,
          problems_solved: s.problems_solved as number,
          upsolved_count:  s.upsolved_count as number,
          user_id:         u?.id as string ?? '',
          user_name:       u?.full_name as string ?? 'Unknown',
          squad_name:      sq?.name ?? null,
        };
      });

      // Derive problem labels from the max problems_solved count (pure helper).
      const maxSolved = Math.max(0, ...rows.map((r) => r.problems_solved));
      const labels = contestProblemLabels(maxSolved);

      return { ...contest, standings: rows, problem_labels: labels } as ContestDetail;
    },
    enabled: !!contestId,
    staleTime: 60_000,
  });
}

// ── Sync a contest (Squad Lead / Admin) ───────────────────────────────────
export function useSyncContest(squadId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cfContestId: string) => {
      const url = squadId
        ? `/api/squads/${squadId}/contests/sync`
        : '/api/admin/contests/sync';
      return api.post(url, { contest_id: cfContestId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}
