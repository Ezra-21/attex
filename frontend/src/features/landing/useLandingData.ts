import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface Verse {
  text: string;
  reference: string;
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  author_id: string;
  author_name?: string;
  created_at: string;
}

export interface PublicStats {
  total_members: number;
  total_problems_solved: number;
  total_contests: number;
}

export function useVerse() {
  return useQuery<Verse>({
    queryKey: ['verse'],
    queryFn: () => api.get('/api/verse').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
    placeholderData: {
      text: 'Whatever you do, work at it with all your heart, as working for the Lord, and not for human masters.',
      reference: 'Colossians 3:23',
    },
  });
}

export function usePublicAnnouncements() {
  return useQuery<PublicAnnouncement[]>({
    queryKey: ['announcements', 'public'],
    queryFn: () => api.get('/api/announcements/public').then((r) => r.data ?? []),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ['stats', 'public'],
    queryFn: () => api.get('/api/stats/public').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    placeholderData: { total_members: 0, total_problems_solved: 0, total_contests: 0 },
  });
}
