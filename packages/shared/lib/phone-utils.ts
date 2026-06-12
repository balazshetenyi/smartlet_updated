export function normalisePhone(raw: string): string | null {
  const stripped = raw.replace(/[\s\-().]/g, "");
  if (!/^[+\d]/.test(stripped)) return null;
  const e164 = stripped.startsWith("0") ? "+44" + stripped.slice(1) : stripped;
  if (!/^\+\d{7,15}$/.test(e164)) return null;
  return e164;
}

export function validatePhone(value: string): string | null {
  if (!value || value.trim() === "") return null;
  if (!normalisePhone(value)) {
    return "Enter a valid phone number (e.g. 07911 123456 or +44 7911 123456)";
  }
  return null;
}
