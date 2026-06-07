import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useMemo } from "react";

const WelcomeSection = ({ name }: { name: string }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {name || "Guest"} 👋</Text>
      <Text style={styles.subtitle}>Find your perfect property</Text>
    </View>
  );
};

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      marginBottom: 32,
    },
    title: {
      fontWeight: "700",
      fontSize: 30,
      color: t.text,
    },
    subtitle: {
      color: t.textSecondary,
    },
  });
}

export default WelcomeSection;
