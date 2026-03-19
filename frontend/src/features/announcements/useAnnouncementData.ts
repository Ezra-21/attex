import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  squad_id: string | null;
  squad_name: string | null;
  author_id: string;
  author_name: string;
  author_role: string;
  created_at: string;
}

// Authenticated — global + own squad (Supabase RLS enforces scope)
export function useAnnouncements(squadId: string | null | undefined) {
  return useQuery({
    queryKey: ['announcements', 'authed', squadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, body, squad_id, created_at,
          author:users(id, full_name, role),
          squad:squads(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return (data ?? []).map((a: Record<string, unknown>) => {
        const author = a.author as { id: string; full_name: string; role: string } | null;
        const squad  = a.squad  as { name: string } | null;
        return {
          id:          a.id,
          title:       a.title,
          body:        a.body,
          squad_id:    a.squad_id as string | null,
          squad_name:  squad?.name ?? null,
          author_id:   author?.id ?? '',
          author_name: author?.full_name ?? 'Unknown',
          author_role: author?.role ?? 'COMMUNITY',
          created_at:  a.created_at,
        } as Announcement;
      });
    },
  });
}

// Public (unauthenticated) — global only, via API
export function usePublicAnnouncementsFull() {
  return useQuery({
    queryKey: ['announcements', 'public-full'],
    queryFn: () =>
      api.get<Announcement[]>('/api/announcements/public').then((r) => r.data ?? []),
    staleTime: 5 * 60_000,
    placeholderData: [],
  });
}

export type PostPayload =
  | { scope: 'GLOBAL';     title: string; body: string }
  | { scope: 'SQUAD';      title: string; body: string; squad_id: string }
  | { scope: 'SQUAD_IDS';  title: string; body: string; squad_ids: string[] };

// Post announcement
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostPayload) => {
      if (payload.scope === 'SQUAD') {
        return api.post('/api/announcements', {
          squad_id: payload.squad_id,
          title: payload.title,
          body: payload.body,
        });
      }
      if (payload.scope === 'SQUAD_IDS') {
        return api.post('/api/admin/announcements', {
          squad_ids: payload.squad_ids,
          title: payload.title,
          body: payload.body,
        });
      }
      return api.post('/api/admin/announcements', { title: payload.title, body: payload.body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}
