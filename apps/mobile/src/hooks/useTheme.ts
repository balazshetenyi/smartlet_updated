import { type AppTheme, darkTheme, lightTheme } from "@kiado/shared";
import { useColorScheme } from "react-native";

export type { AppTheme };

export function useTheme(): AppTheme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}
