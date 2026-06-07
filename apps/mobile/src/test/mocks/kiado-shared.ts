// Mock for @kiado/shared — provides theme exports and a no-op Supabase client

export const lightTheme = {
  bg: "#FFFFFF", bg2: "#F9FAFB", card: "#FFFFFF", border: "#E5E7EB",
  shadow: "rgba(0,0,0,0.08)", overlay: "rgba(0,0,0,0.5)",
  accent: "#7C6CFF", accentHover: "#9388FF",
  text: "#2C3E50", textSub: "#6B7280", textMuted: "#9CA3AF",
  success: "#22C55E", warning: "#F59E0B", error: "#EF4444",
  primary: "#2C3E50", primaryLight: "#e1eaf2", primaryDark: "#4F46E5",
  secondary: "#10B981", danger: "#EF4444",
  background: "#F9FAFB", surface: "#FFFFFF", cardBackground: "#FFFFFF",
  textSecondary: "#6B7280", muted: "#9CA3AF", darkSlateBlue: "#2C3E50",
};

export const darkTheme = {
  bg: "#1F2A37", bg2: "#111827", card: "#243244", border: "#334155",
  shadow: "rgba(0,0,0,0.3)", overlay: "rgba(0,0,0,0.7)",
  accent: "#7C6CFF", accentHover: "#9388FF",
  text: "#FFFFFF", textSub: "#CBD5E1", textMuted: "#94A3B8",
  success: "#22C55E", warning: "#F59E0B", error: "#EF4444",
  primary: "#7C6CFF", primaryLight: "#243244", primaryDark: "#9388FF",
  secondary: "#22C55E", danger: "#EF4444",
  background: "#1F2A37", surface: "#243244", cardBackground: "#243244",
  textSecondary: "#CBD5E1", muted: "#94A3B8", darkSlateBlue: "#FFFFFF",
};

export const colours = lightTheme;
export const dark = darkTheme;

const mockChain = () => {
  const chain: any = {
    select: () => chain, insert: () => chain, update: () => chain,
    delete: () => chain, upsert: () => chain,
    eq: () => chain, neq: () => chain, in: () => chain,
    lt: () => chain, gt: () => chain, lte: () => chain, gte: () => chain,
    is: () => chain, order: () => chain, limit: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (cb: any) => Promise.resolve({ data: null, error: null }).then(cb),
  };
  return chain;
};

export const supabase = {
  from: (_table: string) => mockChain(),
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
  },
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  }),
};
