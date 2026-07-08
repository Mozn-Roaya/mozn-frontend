import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeStation } from "@/test/fixtures";

import { StationOffline } from "./station-offline";

// Locks the offline state's copy in both languages.

describe("StationOffline", () => {
  it("renders English copy", () => {
    render(<StationOffline station={makeStation({ status: "offline" })} lang="en" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("Station unavailable")).toBeInTheDocument();
  });

  it("renders Arabic copy", () => {
    render(<StationOffline station={makeStation({ status: "offline" })} lang="ar" />);
    expect(screen.getByText("غير متصل")).toBeInTheDocument();
    expect(screen.getByText("المحطة غير متاحة")).toBeInTheDocument();
  });

  it("shows a last-seen line when the timestamp is present", () => {
    render(
      <StationOffline
        station={makeStation({ status: "offline", last_seen_at: "2026-07-03T15:55:00Z" })}
        lang="en"
      />,
    );
    expect(screen.getByText(/^Last seen/)).toBeInTheDocument();
  });
});
