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