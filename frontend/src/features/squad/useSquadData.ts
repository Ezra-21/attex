import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────
export interface TopicProblem {
  problem_id: string;
  name: string;
  platform: string;
  external_link: string;
  external_id: string;
  solved?: boolean; // whether the current user has solved it
}

export interface Track {
  id: string;
  title: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  order_index: number;
  problems: TopicProblem[];
}

// ── Full curriculum tree for a squad ────────────────────────────────────
export function useSquadCurriculum(squadId: string | null | undefined, myUserId: string | undefined) {
  return useQuery({
    queryKey: ['squad-curriculum', squadId, myUserId],
    queryFn: async () => {
      if (!squadId) return [];

      // Tracks
      const { data: tracks, error: te } = await supabase
        .from('squad_tracks')
        .select('id, title')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: true });
      if (te) throw te;

      if (!tracks || tracks.length === 0) return [];

      const trackIds = tracks.map((t: { id: string }) => t.id);

      // Topics for all tracks
      const { data: topics, error: tpe } = await supabase
        .from('squad_track_topics')
        .select('id, track_id, title, order_index')
        .in('track_id', trackIds)
        .order('order_index', { ascending: true });
      if (tpe) throw tpe;

      const topicIds = (topics ?? []).map((t: { id: string }) => t.id);

      // Problems for all topics
      const { data: topicProblems, error: ppe } = topicIds.length
        ? await supabase
            .from('topic_problems')
            .select('topic_id, problem_id, problem:problems(id, name, platform, external_link, external_id)')
            .in('topic_id', topicIds)
        : { data: [], error: null };
      if (ppe) throw ppe;

      // My solved problem IDs (for checkmarks)
      let solvedIds = new Set<string>();
      if (myUserId) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('problem_id')
          .eq('user_id', myUserId);
        solvedIds = new Set((subs ?? []).map((s: { problem_id: string }) => s.problem_id));
      }

      // Assemble tree
      const problemsByTopic = new Map<string, TopicProblem[]>();
      for (const tp of topicProblems ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = tp.problem as any;
        const pr = Array.isArray(raw) ? raw[0] : raw;
        if (!pr) continue;
        const list = problemsByTopic.get(tp.topic_id) ?? [];
        list.push({ problem_id: pr.id, name: pr.name, platform: pr.platform, external_link: pr.external_link, external_id: pr.external_id, solved: solvedIds.has(pr.id) });
        problemsByTopic.set(tp.topic_id, list);
      }

      const topicsByTrack = new Map<string, Topic[]>();
      for (const tp of topics ?? []) {
        const list = topicsByTrack.get(tp.track_id) ?? [];
        list.push({ id: tp.id, title: tp.title, order_index: tp.order_index, problems: problemsByTopic.get(tp.id) ?? [] });
        topicsByTrack.set(tp.track_id, list);
      }

      return tracks.map((tr: { id: string; title: string }) => ({
        id: tr.id,
        title: tr.title,
        topics: topicsByTrack.get(tr.id) ?? [],
      })) as Track[];
    },
    enabled: !!squadId,
    staleTime: 60_000,
  });
}

// ── Squad roster ─────────────────────────────────────────────────────────
export interface RosterMember {
  id: string;
  full_name: string;
  role: string;
  problem_count: number;
  daily_streak: number;
}

export function useSquadRoster(squadId: string | null | undefined) {
  return useQuery({
    queryKey: ['squad-roster', squadId],
    queryFn: async () => {
      if (!squadId) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, problem_count, daily_streak')
        .eq('squad_id', squadId)
        .order('problem_count', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RosterMember[];
    },
    enabled: !!squadId,
    staleTime: 60_000,
  });
}

// ── Mutations (Squad Lead only) ──────────────────────────────────────────
export function useCreateTrack(squadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.post(`/api/squads/${squadId}/tracks`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squad-curriculum', squadId] }),
  });
}

export function useCreateTopic(squadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, title }: { trackId: string; title: string }) =>
      api.post(`/api/tracks/${trackId}/topics`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squad-curriculum', squadId] }),
  });
}

export function useAssignProblem(squadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, problemId }: { topicId: string; problemId: string }) =>
      api.post(`/api/topics/${topicId}/problems`, { problem_id: problemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squad-curriculum', squadId] }),
  });
}
