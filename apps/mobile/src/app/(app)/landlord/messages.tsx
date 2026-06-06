import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(account)/messages")}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.success + "22" }]}>
            <MaterialIcons name="chat" size={22} color={theme.success} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Conversations</Text>
            <Text style={styles.cardSub}>View all guest messages</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
    title: { fontSize: 22, fontWeight: "700", color: t.text },
    body: { padding: 20, gap: 12 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 14,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: t.text, marginBottom: 2 },
    cardSub: { fontSize: 12, color: t.textMuted },
  });
}
