import "@testing-library/jest-native/extend-expect";

// Silence non-actionable warnings in tests
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation((msg: string) => {
  // Still surface unexpected errors
  if (!msg?.includes("Warning:")) throw new Error(msg);
});

// React Native Animated — use native driver mock
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Safe area context
jest.mock("react-native-safe-area-context", () => {
  const insets = { top: 44, bottom: 34, left: 0, right: 0 };
  return {
    SafeAreaView: ({ children }: any) => children,
    SafeAreaProvider: ({ children }: any) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Expo Router
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  usePathname: () => "/",
  useFocusEffect: (cb: () => void) => cb(),
  Link: ({ children }: any) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

// Expo image
jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Expo status bar
jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

// Keyboard controller
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: ({ children }: any) => children,
  KeyboardProvider: ({ children }: any) => children,
  KeyboardToolbar: () => null,
}));

// Toast
jest.mock("react-native-toast-notifications", () => ({
  Toast: { show: jest.fn() },
  ToastProvider: ({ children }: any) => children,
}));

// Action sheet
jest.mock("@expo/react-native-action-sheet", () => ({
  useActionSheet: () => ({ showActionSheetWithOptions: jest.fn() }),
  ActionSheetProvider: ({ children }: any) => children,
}));

// Sentry
jest.mock("@sentry/react-native", () => ({
  wrap: (c: any) => c,
  init: jest.fn(),
  captureException: jest.fn(),
}));
