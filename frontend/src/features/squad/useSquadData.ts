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