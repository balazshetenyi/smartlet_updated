import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { colours } from "@kiado/shared";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRIVACY_POLICY } from "@kiado/shared/content/privacy-policy";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Markdown>{PRIVACY_POLICY}</Markdown>
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
