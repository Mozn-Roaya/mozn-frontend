import * as React from "react";

// The "mounted" flag flips once (server/hydration → client) and never changes
// again, so there is nothing to subscribe to — the subscribe callback is a no-op.
const subscribe = () => () => {};

/**
 * Returns `false` during SSR and the initial hydration pass, then `true` once
 * running on the client. Built on useSyncExternalStore (server snapshot `false`,
 * client snapshot `true`) so the server markup and first client paint match and
 * React flips the value right after hydration — the same timing as the classic
 * `useState(false)` + `useEffect(() => setMounted(true))` gate, but without a
 * synchronous setState inside an effect.
 */
export function useMounted(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
