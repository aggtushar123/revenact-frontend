import { useCallback, useState } from 'react';

/** Selected account ids. Cleared when `resetKey` (the filters) changes,
 *  as the spec's selection mode requires. The reset happens during render
 *  (React's "adjust state when a value changes" pattern), not in an effect. */
export function useSelection(resetKey: string) {
  const [state, setState] = useState({ key: resetKey, ids: new Set<number>() });
  let current = state;
  if (state.key !== resetKey) {
    current = { key: resetKey, ids: new Set<number>() };
    setState(current);
  }

  const toggle = useCallback((id: number) => {
    setState((prev) => {
      const ids = new Set(prev.ids);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ...prev, ids };
    });
  }, []);

  const replace = useCallback((ids: number[]) => setState((prev) => ({ ...prev, ids: new Set(ids) })), []);
  const clear = useCallback(() => setState((prev) => ({ ...prev, ids: new Set<number>() })), []);

  return { selected: current.ids, selecting: current.ids.size > 0, toggle, replace, clear };
}
