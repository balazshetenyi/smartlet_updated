import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PropertiesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Properties</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/properties/create-property")}
          accessibilityLabel="Add property"
        >
          <MaterialIcons name="add" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(account)/my-properties")}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.accent + "22" }]}>
            <MaterialIcons name="home" size={22} color={theme.accent} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>My Properties</Text>
            <Text style={styles.cardSub}>Manage your listed properties</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/properties/create-property")}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.success + "22" }]}>
            <MaterialIcons name="add-home" size={22} color={theme.success} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Add New Property</Text>
            <Text style={styles.cardSub}>List a holiday or rental property</Text>
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
    },
    title: { fontSize: 22, fontWeight: "700", color: t.text },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
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
