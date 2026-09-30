export type Difficulty = 'intro' | 'core' | 'advanced' | 'contest';

export interface Track {
  id: string;
  title: string;
  blurb: string;
  order: number;
}

export interface Section {
  heading: string;
  body: string;
  code?: string;
  language?: string;
}

export interface Check {
  id: string;
  prompt: string;
  choices?: string[];
  accept: string[];
  explain: string;
}

export interface Lesson {
  id: string;
  trackId: string;
  moduleId: string;
  title: string;
  difficulty: Difficulty;
  minutes: number;
  summary: string;
  objectives: string[];
  tags: string[];
  prereqs: string[];
  sections: Section[];
  pitfalls: string[];
  checks: Check[];
}

export interface Drill {
  id: string;
  trackId: string;
  topicId: string;
  title: string;
  difficulty: Difficulty;
  minutes: number;
  statement: string;
  inputFmt: string;
  outputFmt: string;
  sampleIn: string;
  sampleOut: string;
  hint: string;
  solution: string;
  language: string;
  tags: string[];
  answer: string;
}

export interface Quiz {
  id: string;
  trackId: string;
  topicId: string;
  title: string;
  minutes: number;
  questions: Check[];
}

export interface Pattern {
  id: string;
  title: string;
  trackId: string;
  idea: string;
  when: string;
  complexity: string;
  signals: string[];
}

export interface SearchHit {
  kind: 'lesson' | 'drill';
  id: string;
  title: string;
  trackId: string;
  difficulty?: Difficulty;
  summary: string;
  score: number;
}

export interface PlanItem {
  lessonId: string;
  title: string;
  trackId: string;
  minutes: number;
  reason: string;
}

export interface Plan {
  hours: number;
  totalMinutes: number;
  items: PlanItem[];
  notes: string[];
}

export interface ArenaProblem {
  drillId: string;
  title: string;
  difficulty: Difficulty;
  minutes: number;
  points: number;
}

export interface Arena {
  title: string;
  minutes: number;
  problems: ArenaProblem[];
  seed: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress: number;
  goal: number;
}

export interface Card {
  ease: number;
  interval: number;
  reps: number;
  due: string;
}

export interface ProgressState {
  lessons: Record<string, { done: boolean; at: string }>;
  drills: Record<string, { solved: boolean; hints: number; at: string }>;
  cards: Record<string, Card>;
  quizzes: Record<string, { correct: number; total: number; score: number; at: string }>;
  reviews: number;
  arenas: number;
  plans: number;
}
