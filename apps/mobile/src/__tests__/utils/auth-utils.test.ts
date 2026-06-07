import { getPasswordStrength, getPasswordStrengthText, formatPostcode } from "@/utils/auth-utils";

describe("getPasswordStrength", () => {
  it("returns 0 for an empty string", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("returns 5 for a fully strong password", () => {
    expect(getPasswordStrength("Str0ng!Pass")).toBe(5);
  });

  it("increments for each satisfied criterion", () => {
    expect(getPasswordStrength("abcdefgh")).toBe(2);  // length + lowercase
    expect(getPasswordStrength("Abcdefgh")).toBe(3);  // + uppercase
    expect(getPasswordStrength("Abcdef1h")).toBe(4);  // + digit
    expect(getPasswordStrength("Abcdef1!")).toBe(5);  // + special
  });
});

describe("getPasswordStrengthText", () => {
  it("returns 'Very Weak' for strength 0 and 1", () => {
    expect(getPasswordStrengthText(0).text).toBe("Very Weak");
    expect(getPasswordStrengthText(1).text).toBe("Very Weak");
  });

  it("returns 'Weak' for strength 2", () => {
    expect(getPasswordStrengthText(2).text).toBe("Weak");
  });

  it("returns 'Fair' for strength 3", () => {
    expect(getPasswordStrengthText(3).text).toBe("Fair");
  });

  it("returns 'Good' for strength 4", () => {
    expect(getPasswordStrengthText(4).text).toBe("Good");
  });

  it("returns 'Strong' for strength 5", () => {
    expect(getPasswordStrengthText(5).text).toBe("Strong");
  });

  it("returns a hex colour for every level", () => {
    [0, 1, 2, 3, 4, 5].forEach((s) => {
      expect(getPasswordStrengthText(s).color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

describe("formatPostcode", () => {
  it("inserts a space in a standard UK postcode", () => {
    expect(formatPostcode("SW1A1AA")).toBe("SW1A 1AA");
  });

  it("handles lower-case input", () => {
    expect(formatPostcode("sw1a1aa")).toBe("SW1A 1AA");
  });
});
