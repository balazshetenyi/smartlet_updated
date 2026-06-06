import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRIVACY_POLICY } from "@kiado/shared/content/privacy-policy";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Markdown>{PRIVACY_POLICY}</Markdown>
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
