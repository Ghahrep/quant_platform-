import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercentage, cn } from "../index";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats currency correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
    });
  });

  describe("formatPercentage", () => {
    it("formats percentage correctly", () => {
      expect(formatPercentage(0.1234)).toBe("12.3%");
      expect(formatPercentage(0.1234, 2)).toBe("12.34%");
    });
  });

  describe("cn (className utility)", () => {
    it("combines class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
      expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
    });
  });
});
