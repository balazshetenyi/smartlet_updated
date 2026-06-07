import { useTheme } from "@/hooks/useTheme";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface ICard {
  children: React.ReactNode;
  style?: any;
}

export const Card = ({ children, style }: ICard) => {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.surface,
          borderRadius: 12,
          marginBottom: 16,
          elevation: 2,
          shadowColor: theme.overlay,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
      }),
    [theme],
  );

  return <View style={[styles.card, style]}>{children}</View>;
};
