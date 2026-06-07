/**
 * useTheme tests.
 *
 * Testing the colour-scheme switching requires mocking the React Native
 * native bridge which isn't reliable in jest-expo. Instead we test the
 * theme token contracts directly — that the two themes are correctly
 * shaped and that key invariants hold.
 */
import { lightTheme, darkTheme } from "@/test/mocks/kiado-shared";

describe("lightTheme tokens", () => {
  it("has a white surface", () => expect(lightTheme.surface).toBe("#FFFFFF"));
  it("has a dark primary text colour", () => expect(lightTheme.text).toBe("#2C3E50"));
  it("has the correct accent colour", () => expect(lightTheme.accent).toBe("#7C6CFF"));
  it("exports all required keys", () => {
    const required = ["bg", "bg2", "card", "border", "accent", "text", "textSub", "textMuted", "success", "warning", "error", "primary", "surface"];
    required.forEach((k) => expect(lightTheme).toHaveProperty(k));
  });
});

describe("darkTheme tokens", () => {
  it("has a dark bg", () => expect(darkTheme.bg).toBe("#1F2A37"));
  it("has white primary text colour", () => expect(darkTheme.text).toBe("#FFFFFF"));
  it("has the correct accent colour", () => expect(darkTheme.accent).toBe("#7C6CFF"));
  it("exports all required keys", () => {
    const required = ["bg", "bg2", "card", "border", "accent", "text", "textSub", "textMuted", "success", "warning", "error", "primary", "surface"];
    required.forEach((k) => expect(darkTheme).toHaveProperty(k));
  });
});

describe("theme invariants", () => {
  it("both themes share the same accent colour", () => {
    expect(lightTheme.accent).toBe(darkTheme.accent);
  });

  it("success and warning colours are identical across themes", () => {
    expect(lightTheme.success).toBe(darkTheme.success);
    expect(lightTheme.warning).toBe(darkTheme.warning);
  });

  it("light and dark themes have different backgrounds", () => {
    expect(lightTheme.bg).not.toBe(darkTheme.bg);
    expect(lightTheme.text).not.toBe(darkTheme.text);
  });
});
