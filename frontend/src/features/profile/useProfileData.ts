import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { bucketSubmissionsByDay } from '../../lib/derive';

// ── Full user profile ─────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  telegram_handle: string;
  linkedin_url: string | null;
  leetcode_handle: string | null;
  codeforces_handle: string | null;
  atcoder_handle: string | null;
  role: string;
  is_banned: boolean;
  problem_count: number;
  daily_streak: number;
  last_submission_date: string | null;
  squad_id: string | null;
  squad_name: string | null;
  created_at: string;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-full', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*, squad:squads(name)')
        .eq('id', userId)
        .single();
      if (error) throw error;
      const squad = data?.squad as { name: string } | null;
      return { ...data, squad_name: squad?.name ?? null } as UserProfile;
    },
    enabled: !!userId,
  });
}

// ── Role history ─────────────────────────────────────────────────────────
export interface RoleHistoryEntry {
  id: string;
  role: string;
  squad_name: string | null;
  assigned_at: string;
}

export function useRoleHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['role-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_roles_history')
        .select('id, role, assigned_at, squad:squads(name)')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });