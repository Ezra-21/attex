import { useUserProfile } from './useUserProfile';
import type { Role } from '../lib/tokens';

export interface AppUser {
  id: string;
  fullName: string;
  role: Role;
  squadId: string | null;
  squadName: string | null;
  problemCount: number;
  dailyStreak: number;
  lastSubmissionDate: string | null;
  isLoading: boolean;
}

export function useAppUser(): AppUser {
  const { data: profile, isLoading } = useUserProfile();
  return {
    id:                 (profile?.id                   as string) ?? '',
    fullName:           (profile?.full_name            as string) ?? '',
    role:               (profile?.role                 as Role)   ?? 'COMMUNITY',
    squadId:            (profile?.squad_id             as string | null) ?? null,
    squadName:          (profile?.squad_name           as string | null) ?? null,
    problemCount:       (profile?.problem_count        as number) ?? 0,
    dailyStreak:        (profile?.daily_streak         as number) ?? 0,
    lastSubmissionDate: (profile?.last_submission_date as string | null) ?? null,
    isLoading,
  };
}
