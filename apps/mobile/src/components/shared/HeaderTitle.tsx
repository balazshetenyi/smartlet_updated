import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

type HeaderTitleProps = {
  title: string;
};

export const HeaderTitle = ({ title }: HeaderTitleProps) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.headerTitle}>
      {title}
    </Text>
  );
};

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: t.text,
      maxWidth: 220,
    },
  });
}
