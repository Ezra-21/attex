import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useUserProfile(overrideUserId?: string) {
  const { user } = useAuth();
  const userId = overrideUserId ?? user?.id;

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*, squad:squads(name)')
        .eq('id', userId)
        .single();
      // PGRST116 = no rows — new user whose trigger hasn't created the row yet
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      // Flatten squad name onto the row for convenience
      const squad = data?.squad as { name: string } | null;
      return { ...data, squad_name: squad?.name ?? null };
    },
    enabled: !!userId,
  });
}
