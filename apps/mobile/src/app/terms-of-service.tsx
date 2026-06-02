import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { TERMS_OF_SERVICE } from "@kiado/shared/content/terms-of-service";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

export default function TermsOfServiceScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Markdown>{TERMS_OF_SERVICE}</Markdown>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: t.surface },
  content: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: t.text,
    marginBottom: 8,
  },
  body: { color: t.text, fontSize: 14, lineHeight: 20 },
  });
}
