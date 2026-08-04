export type MapTheme = "light" | "dark";

/**
 * Imperative handle exposed by `<LeafletLibyaMap>` to parent controls
 * (zoom buttons, "Stations near me"). Kept narrow on purpose — every method
 * here is something a UI control fires, not internal map plumbing.
 */
export type LeafletLibyaMapHandle = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  /**
   * Fit the camera to a set of lat/lng pairs. Used by the "Stations near
   * me" control to frame the user's nearest stations. No-op when called
   * with an empty array.
   */
  readonly flyToBounds: (
    points: ReadonlyArray<readonly [number, number]>,
  ) => void;
};
