import { useState } from "react";
export function useLocalState<T>(key: string, initial: T) {
  const read = (): T => {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null") ?? initial;
    } catch {
      return initial;
    }
  };
  const [state, setState] = useState(() => ({ key, value: read() }));
  return [
    state.key === key ? state.value : read(),
    (next: T) => {
      setState({ key, value: next });
      sessionStorage.setItem(key, JSON.stringify(next));
    },
  ] as const;
}
