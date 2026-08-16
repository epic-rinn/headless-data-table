function depsChanged(
  previous: readonly unknown[],
  next: readonly unknown[],
): boolean {
  if (previous.length !== next.length) return true;
  for (let i = 0; i < next.length; i++) {
    if (!Object.is(previous[i], next[i])) return true;
  }
  return false;
}

export function memo<TDeps extends readonly unknown[], TResult>(
  getDeps: () => readonly [...TDeps],
  compute: (...deps: [...TDeps]) => TResult,
): () => TResult {
  let cache: { deps: readonly unknown[]; result: TResult } | null = null;

  return () => {
    const deps = getDeps();
    if (cache && !depsChanged(cache.deps, deps)) {
      return cache.result;
    }
    const result = compute(...deps);
    cache = { deps, result };
    return result;
  };
}
