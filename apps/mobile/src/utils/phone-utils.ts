/**
 * Normalises and validates a phone number.
 *
 * Accepts:
 *  - International format:  +44 7911 123456  /  +447911123456
 *  - UK local format:       07911 123456     /  07911123456
 *  - Other national formats with or without spaces/dashes/parens
 *
 * Returns the normalised E.164-ish string (digits + leading +) or null if invalid.
 */
export function normalisePhone(raw: string): string | null {
  // Strip all whitespace, dashes, dots and parentheses
  const stripped = raw.replace(/[\s\-().]/g, "");

  // Must start with + or a digit
  if (!/^[+\d]/.test(stripped)) return null;

  // Convert UK local 07xxx → +447xxx
  const e164 = stripped.startsWith("0") ? "+44" + stripped.slice(1) : stripped;

  // Final check: + followed by 7–15 digits (ITU-T E.164)
  if (!/^\+\d{7,15}$/.test(e164)) return null;

  return e164;
}

/**
 * Returns a human-readable error message if the phone number is invalid,
 * or null if it is valid. Accepts empty string as valid (phone is optional).
 */
export function validatePhone(value: string): string | null {
  if (!value || value.trim() === "") return null; // optional field
  if (!normalisePhone(value)) {
    return "Enter a valid phone number (e.g. 07911 123456 or +44 7911 123456)";
  }
  return null;
}
