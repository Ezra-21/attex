import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

// ── Users ─────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  squad_id: string | null;
  squad_name: string | null;
  is_banned: boolean;
  is_active: boolean;
  problem_count: number;
  created_at: string;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, squad_id, is_banned, is_active, problem_count, created_at, squad:squads(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((u: Record<string, unknown>) => {
        const sq = u.squad as { name: string } | null;
        return { ...u, squad_name: sq?.name ?? null } as AdminUser;
      });
    },
    staleTime: 30_000,
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, squadId }: { userId: string; role: string; squadId?: string | null }) =>
      api.put(`/api/admin/users/${userId}/role`, { role, squad_id: squadId ?? undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useUpdateSquad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, squadId }: { userId: string; squadId: string | null }) =>
      api.put(`/api/admin/users/${userId}/squad`, { squad_id: squadId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function useUpdateBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isBanned }: { userId: string; isBanned: boolean }) =>
      api.put(`/api/admin/users/${userId}/ban`, { is_banned: isBanned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

// ── Squads list (for squad assignment dropdown) ───────────────────────────
export interface Squad { id: string; name: string; created_at?: string }

export function useSquads() {
  return useQuery({
    queryKey: ['squads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('squads').select('id, name').order('name');
      if (error) throw error;
      return (data ?? []) as Squad[];
    },
    staleTime: 120_000,
  });
}

export function useCreateSquad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.post<Squad>('/api/admin/squads', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['squads'] });
      qc.invalidateQueries({ queryKey: ['admin-squads'] });
    },
  });
}

export function useUpdateSquadName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ squadId, name }: { squadId: string; name: string }) =>
      api.put<Squad>(`/api/admin/squads/${squadId}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['squads'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeleteSquad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (squadId: string) =>
      api.delete(`/api/admin/squads/${squadId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['squads'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// ── Invitations ───────────────────────────────────────────────────────────
export interface Invitation {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export function useInvitations() {
  return useQuery({
    queryKey: ['admin-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, token, expires_at, used_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
    staleTime: 30_000,
  });
}

export function useGenerateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.post<{ token: string; invite_url: string; email_sent: boolean; email_warning?: string }>('/api/admin/invitations', { email }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-invitations'] }),
  });
}

// ── Signup toggle (Super Admin only) ────────────────────────────────────
export function useSignupStatus() {
  return useQuery({
    queryKey: ['signup-status'],
    queryFn: () => api.get<{ open: boolean }>('/api/system/signup-status').then((r) => r.data.open),
    staleTime: 60_000,
  });
}

export function useToggleSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (open: boolean) => api.put('/api/admin/system/signup', { open }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signup-status'] }),
  });
}

// ── Contest sync history (last N synced) ─────────────────────────────────
export function useRecentSyncs() {
  return useQuery({
    queryKey: ['recent-syncs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('id, name, external_id, synced_at')
        .order('synced_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
