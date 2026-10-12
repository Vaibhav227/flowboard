import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { useAppStore } from "../stores/appStore";

describe("user switcher", () => {
  beforeEach(() => useAppStore.getState().reset());

  it("updates the visible workspace when switching to Bob", () => {
    render(<App />);

    expect(screen.getByText("Research queue")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue(/Alice Johnson/), {
      target: { value: "bob" },
    });

    expect(screen.queryByText("Research queue")).not.toBeInTheDocument();
    expect(screen.getAllByText("Launch board").length).toBeGreaterThan(0);
  });
});
