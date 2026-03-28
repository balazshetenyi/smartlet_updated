import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { colours } from "@kiado/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { TERMS_OF_SERVICE } from "@kiado/shared/content/terms-of-service";

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Markdown>{TERMS_OF_SERVICE}</Markdown>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.surface },
  content: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 8,
  },
  body: { color: colours.text, fontSize: 14, lineHeight: 20 },
});
