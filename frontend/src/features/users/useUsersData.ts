import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface UserSummary {
  id: string;
  full_name: string;
  role: string;
  squad_id: string | null;
  squad_name: string | null;
  problem_count: number;
  daily_streak: number;
  codeforces_handle: string;
  created_at: string;
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['users-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, squad_id, problem_count, daily_streak, codeforces_handle, created_at, squad:squads(name)')
        .eq('is_active', true)
        .eq('is_banned', false)
        .order('problem_count', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((u: Record<string, unknown>) => {
        const sq = u.squad as { name: string } | null;
        return { ...u, squad_name: sq?.name ?? null } as UserSummary;
      });
    },
    staleTime: 60_000,
  });
}
