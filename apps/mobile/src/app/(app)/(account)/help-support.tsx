import { useTheme, type AppTheme } from "@/hooks/useTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FAQ_CATEGORIES, SUPPORT_EMAIL } from "@kiado/shared/content/faq";
import { useMemo, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HelpSupportScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: string) =>
    setExpanded((prev) => (prev === key ? null : key));

  return (
    <ScrollView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {FAQ_CATEGORIES.map((category) => (
        <View key={category.title} style={styles.section}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <View style={styles.card}>
            {category.items.map((item, i) => {
              const key = `${category.title}-${i}`;
              const isOpen = expanded === key;
              return (
                <View
                  key={key}
                  style={[
                    styles.item,
                    i < category.items.length - 1 && styles.itemDivider,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.question}
                    onPress={() => toggle(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.questionText}>{item.question}</Text>
                    <MaterialIcons
                      name={
                        isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"
                      }
                      size={20}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                  {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {/* Contact section */}
      <View style={styles.section}>
        <Text style={styles.categoryTitle}>Still need help?</Text>
        <View style={styles.card}>
          <View style={styles.contactContent}>
            <MaterialIcons name="mail-outline" size={32} color={theme.accent} />
            <Text style={styles.contactHeading}>Contact Support</Text>
            <Text style={styles.contactBody}>
              Our team is happy to help. We aim to respond within one business
              day.
            </Text>
            <TouchableOpacity
              style={styles.emailBtn}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              <MaterialIcons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.emailBtnText}>Send us an email</Text>
            </TouchableOpacity>
            <Text style={styles.emailAddress}>{SUPPORT_EMAIL}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 20, paddingTop: 16 },
    section: { marginBottom: 24 },
    categoryTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: t.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
    },
    item: { paddingHorizontal: 16 },
    itemDivider: { borderBottomWidth: 1, borderBottomColor: t.border },
    question: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      gap: 12,
    },
    questionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
      lineHeight: 20,
    },
    answer: {
      fontSize: 13,
      color: t.textSub,
      lineHeight: 20,
      paddingBottom: 14,
    },
    contactContent: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 16,
      gap: 8,
    },
    contactHeading: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
      marginTop: 4,
    },
    contactBody: {
      fontSize: 13,
      color: t.textMuted,
      textAlign: "center",
      lineHeight: 19,
    },
    emailBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: t.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    emailBtnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
    emailAddress: { fontSize: 12, color: t.textMuted, marginTop: 4 },
  });
}
