import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TemperatureCard } from "./temperature-card";

// Characterizes the visible copy the card emits in each language so a refactor
// of its markup can't change what the user reads.

describe("TemperatureCard", () => {
  it("renders English labels", () => {
    render(<TemperatureCard current={28} feelsLike={30} high={37} low={24} lang="en" />);
    expect(screen.getByText("Temperature")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("Feels like 30°")).toBeInTheDocument();
    expect(screen.getByText("H: 37°")).toBeInTheDocument();
    expect(screen.getByText("L: 24°")).toBeInTheDocument();
  });

  it("renders Arabic labels", () => {
    render(<TemperatureCard current={28} feelsLike={30} high={37} low={24} lang="ar" />);
    expect(screen.getByText("درجة الحرارة")).toBeInTheDocument();
    expect(screen.getByText("الإحساس كأنها 30°")).toBeInTheDocument();
    expect(screen.getByText("ع: 37°")).toBeInTheDocument();
    expect(screen.getByText("ص: 24°")).toBeInTheDocument();
  });

  it("shows an em dash when no reading is present", () => {
    render(<TemperatureCard current={null} lang="en" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
