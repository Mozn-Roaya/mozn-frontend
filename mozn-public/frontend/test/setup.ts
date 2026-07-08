import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount any React trees rendered during a test so component tests added in
// later phases don't leak DOM into each other. Harmless for the pure-logic
// tests that ship with the Phase 0 safety net.
afterEach(() => {
  cleanup();
});
