import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MIName = React.ComponentProps<typeof MaterialIcons>["name"];

interface MenuItem {
  icon: MIName;
  label: string;
  sub: string;
  route: string;
}

const MENU: MenuItem[] = [
  { icon: "security",      label: "Surveillance Reports", sub: "Reports you've submitted",  route: "/(account)/my-reports"      },
  { icon: "notifications", label: "Notifications",        sub: "Manage your alerts",        route: "/(account)/notifications"   },
  { icon: "lock",          label: "Change Password",      sub: "Update your password",      route: "/(account)/change-password" },
  { icon: "help",          label: "Help & Support",       sub: "Get help with the app",     route: "/(account)/help-support"    },
  { icon: "gavel",         label: "Terms of Service",     sub: "Read our terms",            route: "/terms-of-service"          },
  { icon: "privacy-tip",   label: "Privacy Policy",       sub: "Read our privacy policy",   route: "/privacy-policy"            },
];

export default function MoreTab() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut, deleteAccount } = useAuthStore();
  const firstName = profile?.first_name ?? "";
  const lastName  = profile?.last_name  ?? "";
  const initial   = (firstName[0] ?? "?").toUpperCase();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteAccount();
            if (!result.success) {
              Alert.alert("Error", result.error ?? "Failed to delete account.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile card — edit button goes straight to the edit form */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push("/(account)/profile")}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{firstName} {lastName}</Text>
            <Text style={styles.profileEmail}>{profile?.email ?? ""}</Text>
          </View>
          <MaterialIcons name="edit" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < MENU.length - 1 && styles.menuDivider]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: theme.accent + "22" }]}>
                <MaterialIcons name={item.icon} size={18} color={theme.accent} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
          <MaterialIcons name="logout" size={18} color={theme.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete account — visually quieter, clearly destructive */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: t.bg },
    header:       { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
    title:        { fontSize: 22, fontWeight: "700", color: t.text },
    scroll:       { paddingHorizontal: 20 },
    profileCard: {
      flexDirection: "row", alignItems: "center", backgroundColor: t.card,
      borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border,
      gap: 14, marginBottom: 16,
    },
    avatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: t.accent, justifyContent: "center", alignItems: "center" },
    avatarInitial: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
    profileInfo:  { flex: 1 },
    profileName:  { fontSize: 16, fontWeight: "700", color: t.text, marginBottom: 2 },
    profileEmail: { fontSize: 12, color: t.textMuted },
    menuCard: {
      backgroundColor: t.card, borderRadius: 16, borderWidth: 1,
      borderColor: t.border, overflow: "hidden", marginBottom: 16,
    },
    menuItem:    { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    menuDivider: { borderBottomWidth: 1, borderBottomColor: t.border },
    menuIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    menuText:    { flex: 1 },
    menuLabel:   { fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 1 },
    menuSub:     { fontSize: 11, color: t.textMuted },
    signOutBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: t.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: t.error + "44", gap: 8, marginBottom: 12,
    },
    signOutText: { fontSize: 14, fontWeight: "600", color: t.error },
    deleteBtn: {
      alignItems: "center",
      paddingVertical: 12,
    },
    deleteText: {
      fontSize: 13,
      color: t.textMuted,
      textDecorationLine: "underline",
    },
  });
}
