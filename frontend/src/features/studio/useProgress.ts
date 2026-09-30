import { useCallback, useState } from 'react';
import type { ProgressState } from './types';
import { loadProgress, saveProgress } from './engine/progress';

export function useStudioProgress() {
  const [state, setState] = useState<ProgressState>(() => loadProgress());
  const update = useCallback((next: ProgressState) => {
    saveProgress(next);
    setState(next);
  }, []);
  return [state, update] as const;
}
