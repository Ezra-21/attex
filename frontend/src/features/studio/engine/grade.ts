import type { Check, Quiz } from '../types';

export function normalize(s: string): string {
  return s.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

export function grade(given: string, accept: string[]): boolean {
  const g = normalize(given);
  if (!g) return false;
  return accept.some((a) => normalize(a) === g);
}

export interface GradeDetail {
  id: string;
  correct: boolean;
  explain: string;
}

export interface GradeResult {
  quizId: string;
  correct: number;
  total: number;
  score: number;
  details: GradeDetail[];
}

export function gradeQuiz(quiz: Quiz, answers: Record<string, string>): GradeResult {
  const details = quiz.questions.map((q) => ({
    id: q.id,
    correct: grade(answers[q.id] ?? '', q.accept),
    explain: q.explain,
  }));
  const correct = details.filter((d) => d.correct).length;
  const total = quiz.questions.length;
  return {
    quizId: quiz.id,
    correct,
    total,
    score: total ? Math.floor((correct * 100) / total) : 0,
    details,
  };
}

export function gradeCheck(check: Check, given: string): boolean {
  return grade(given, check.accept);
}
