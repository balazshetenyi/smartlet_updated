import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";

type MIName = React.ComponentProps<typeof MaterialIcons>["name"];

interface MenuItem {
  icon: MIName;
  label: string;
  sub: string;
  route: string;
}

const MENU: MenuItem[] = [
  { icon: "person",          label: "Profile",              sub: "Edit personal details",           route: "/(account)/profile"         },
  { icon: "account-balance", label: "Earnings",             sub: "View payouts and reports",        route: "/(account)/earnings"        },
  { icon: "payments",        label: "Payout Settings",      sub: "Bank account and payouts",        route: "/(account)/payout-setup"    },
  { icon: "security",        label: "Surveillance Reports", sub: "Review reports on your properties", route: "/(account)/my-reports"    },
  { icon: "luggage",         label: "My Travel Bookings",   sub: "Properties you've booked as a guest", route: "/(account)/my-bookings" },
  { icon: "notifications",   label: "Notifications",        sub: "Manage alerts",                   route: "/(account)/notifications"   },
  { icon: "lock",            label: "Change Password",      sub: "Update your password",            route: "/(account)/change-password" },
  { icon: "help",            label: "Help & Support",       sub: "Get help with the app",           route: "/(account)/help-support"    },
  { icon: "gavel",           label: "Terms of Service",     sub: "Read our terms",                  route: "/terms-of-service"          },
  { icon: "privacy-tip",     label: "Privacy Policy",       sub: "Read our privacy policy",         route: "/privacy-policy"            },
];

export default function MoreTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile, signOut } = useAuthStore();
  const firstName = profile?.first_name ?? "";
  const lastName  = profile?.last_name  ?? "";
  const initial   = (firstName[0] ?? "?").toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{firstName} {lastName}</Text>
            <Text style={styles.profileEmail}>{profile?.email ?? ""}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(account)/profile")}>
            <MaterialIcons name="edit" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu items */}
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

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
    title: { fontSize: 22, fontWeight: "700", color: t.text },
    scrollContent: { paddingHorizontal: 20 },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 14,
      marginBottom: 16,
    },
    profileAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: t.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    profileInitial: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: "700", color: t.text, marginBottom: 2 },
    profileEmail: { fontSize: 12, color: t.textMuted },
    menuCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    menuDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 1 },
    menuSub: { fontSize: 11, color: t.textMuted },
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.error + "44",
      gap: 8,
    },
    signOutText: { fontSize: 14, fontWeight: "600", color: t.error },
  });
}
