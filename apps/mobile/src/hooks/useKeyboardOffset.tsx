import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useKeyboardOffset() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardOffset = headerHeight + insets.bottom;

  return { keyboardOffset };
}
