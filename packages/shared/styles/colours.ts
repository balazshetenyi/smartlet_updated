// Unified theme shape — all screens use this type regardless of light/dark mode.
// Both lightTheme and darkTheme carry identical property names so the only
// code change needed in a screen is swapping the import.
export type AppTheme = {
  // Modern naming (used by landlord dashboard screens)
  bg: string;
  bg2: string;
  card: string;
  border: string;
  shadow: string;
  overlay: string;
  accent: string;
  accentHover: string;
  text: string;
  textSub: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  // Legacy naming — kept so all existing screens keep compiling unchanged
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  danger: string;
  background: string;
  surface: string;
  cardBackground: string;
  textSecondary: string;
  muted: string;
  darkSlateBlue: string;
};

export const lightTheme: AppTheme = {
  // Modern
  bg:          "#FFFFFF",
  bg2:         "#F9FAFB",
  card:        "#FFFFFF",
  border:      "#E5E7EB",
  shadow:      "rgba(0, 0, 0, 0.08)",
  overlay:     "rgba(0, 0, 0, 0.5)",
  accent:      "#7C6CFF",
  accentHover: "#9388FF",
  text:        "#2C3E50",
  textSub:     "#6B7280",
  textMuted:   "#9CA3AF",
  success:     "#22C55E",
  warning:     "#F59E0B",
  error:       "#EF4444",
  // Legacy
  primary:        "#2C3E50",
  primaryLight:   "#e1eaf2",
  primaryDark:    "#4F46E5",
  secondary:      "#10B981",
  danger:         "#EF4444",
  background:     "#F9FAFB",
  surface:        "#FFFFFF",
  cardBackground: "#FFFFFF",
  textSecondary:  "#6B7280",
  muted:          "#9CA3AF",
  darkSlateBlue:  "#2C3E50",
};

export const darkTheme: AppTheme = {
  // Modern
  bg:          "#1F2A37",
  bg2:         "#111827",
  card:        "#243244",
  border:      "#334155",
  shadow:      "rgba(0, 0, 0, 0.3)",
  overlay:     "rgba(0, 0, 0, 0.7)",
  accent:      "#7C6CFF",
  accentHover: "#9388FF",
  text:        "#FFFFFF",
  textSub:     "#CBD5E1",
  textMuted:   "#94A3B8",
  success:     "#22C55E",
  warning:     "#F59E0B",
  error:       "#EF4444",
  // Legacy (mapped to dark equivalents so screens using colours.xxx still work)
  primary:        "#7C6CFF",
  primaryLight:   "#243244",
  primaryDark:    "#9388FF",
  secondary:      "#22C55E",
  danger:         "#EF4444",
  background:     "#1F2A37",
  surface:        "#243244",
  cardBackground: "#243244",
  textSecondary:  "#CBD5E1",
  muted:          "#94A3B8",
  darkSlateBlue:  "#FFFFFF",
};

// Backwards-compatible aliases
export const colours = lightTheme;
export type Colours = keyof AppTheme;
export const dark = darkTheme;
