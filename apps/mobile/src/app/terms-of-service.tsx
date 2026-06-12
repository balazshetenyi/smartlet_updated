import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { TERMS_OF_SERVICE } from "@kiado/shared/content/terms-of-service";
import { Stack } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";

export default function TermsOfServiceScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Terms of Service" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Markdown style={styles.markdown}>{TERMS_OF_SERVICE}</Markdown>
      </ScrollView>
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface },
    content: { padding: 20 },
    markdown: {
      heading1: { color: t.text, marginTop: 24, marginBottom: 8 },
      heading2: { color: t.text, marginTop: 20, marginBottom: 6 },
      heading3: { color: t.text, marginTop: 16, marginBottom: 4 },
      paragraph: { color: t.text, marginBottom: 12, lineHeight: 22 },
      strong: { color: t.text },
      bullet_list: { color: t.text, marginBottom: 12 },
      ordered_list: { color: t.text, marginBottom: 12 },
      list_item: { color: t.text, marginBottom: 4 },
      code_inline: { color: t.text },
      code_block: { color: t.text },
      hr: { backgroundColor: t.border, marginVertical: 16 },
      table: { borderWidth: 1, borderColor: t.border, marginBottom: 12 },
      thead: { backgroundColor: t.bg2 ?? t.surface },
      tbody: {},
      tr: { borderBottomWidth: 1, borderColor: t.border, flexDirection: 'row' },
      th: { flex: 1, padding: 8, color: t.text, fontWeight: '700' },
      td: { flex: 1, padding: 8, color: t.text },
    } as any,
  });
}
