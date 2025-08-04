import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App Component", () => {
  it("renders without crashing", () => {
    render(<App />);
    // Look for any text that should be in your app
    expect(screen.getByText(/Gertie/i)).toBeInTheDocument();
  });
});
