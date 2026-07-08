import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Tracks the user's `prefers-reduced-motion` setting. Returns `false` until
 * mounted (so SSR/first paint assume motion is allowed, then correct on the
 * client). Used to gate chart entrance animations — data stays readable either
 * way; the animation is the only thing suppressed.
 */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
