"use client";

import * as React from "react";

import { readMapTheme } from "../lib/theme-style";

import type { MapTheme } from "../types";

const THEME_CHANGE_EVENT = "mozn-theme-change";

/**
 * Calls `onChange` whenever the document theme flips. Listens to BOTH the
 * synchronous `mozn-theme-change` event (dispatched by `ThemeToggle`) and
 * a `MutationObserver` on `data-theme` so the map reacts even if some other
 * code path sets the attribute directly.
 *
 * Ref'd callback so consumers can pass a fresh function each render without
 * resubscribing.
 */
export function useMapTheme(onChange: (theme: MapTheme) => void): void {
  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    const fire = () => onChangeRef.current(readMapTheme());

    window.addEventListener(THEME_CHANGE_EVENT, fire);
    const observer = new MutationObserver(fire);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, fire);
      observer.disconnect();
    };
  }, []);
}
