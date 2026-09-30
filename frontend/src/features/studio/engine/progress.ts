import type { ProgressState } from '../types';
import { schedule } from './review';

const KEY = 'focus-studio-progress-v1';

export function emptyProgress(): ProgressState {
  return { lessons: {}, drills: {}, cards: {}, quizzes: {}, reviews: 0, arenas: 0, plans: 0 };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function markLesson(state: ProgressState, lessonId: string, done: boolean): ProgressState {
  return {
    ...state,
    lessons: { ...state.lessons, [lessonId]: { done, at: new Date().toISOString() } },
  };
}

export function solveDrill(state: ProgressState, drillId: string, hints: number): ProgressState {
  return {
    ...state,
    drills: { ...state.drills, [drillId]: { solved: true, hints, at: new Date().toISOString() } },
  };
}

export function saveQuiz(state: ProgressState, quizId: string, correct: number, total: number, score: number): ProgressState {
  return {
    ...state,
    quizzes: { ...state.quizzes, [quizId]: { correct, total, score, at: new Date().toISOString() } },
  };
}

export function reviewCard(state: ProgressState, cardId: string, quality: number, now = new Date()): ProgressState {
  const prev = state.cards[cardId] ?? { ease: 2.5, interval: 0, reps: 0, due: new Date(0).toISOString() };
  return {
    ...state,
    reviews: state.reviews + 1,
    cards: { ...state.cards, [cardId]: schedule(prev, quality, now) },
  };
}
