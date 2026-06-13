import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { upsertServiceOperatorProfile } from "@/utils/service-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@kiado/shared";

type MIName = React.ComponentProps<typeof MaterialIcons>["name"];

interface MenuItem {
  icon: MIName;
  label: string;
  sub: string;
  route: string;
}

const MENU: MenuItem[] = [
  { icon: "person",          label: "Profile",          sub: "Edit personal details",    route: "/(account)/profile"         },
  { icon: "notifications",   label: "Notifications",    sub: "Manage alerts",            route: "/(account)/notifications"   },
  { icon: "lock",            label: "Change Password",  sub: "Update your password",     route: "/(account)/change-password" },
  { icon: "account-balance", label: "Payout Settings",  sub: "Connect your bank account", route: "/(account)/payout-setup"   },
  { icon: "help",            label: "Help & Support",   sub: "Get help with the app",    route: "/(account)/help-support"    },
];

export default function ServiceMoreScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const [available, setAvailable] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("service_operator_profiles")
      .select("is_available")
      .eq("id", profile.id)
      .maybeSingle();
    if (data) setAvailable(data.is_available);
  }, [profile?.id]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  async function handleToggleAvailability(value: boolean) {
    if (!profile?.id || togglingAvailability) return;
    setTogglingAvailability(true);
    setAvailable(value);
    const { error } = await upsertServiceOperatorProfile(profile.id, {
      is_available: value,
    });
    setTogglingAvailability(false);
    if (error) {
      setAvailable(!value);
      Alert.alert("Error", "Could not update availability. Please try again.");
    }
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Identity */}
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={32} color={theme.textMuted} />
        </View>
        <View>
          <Text style={styles.name}>{displayName || "Service Operator"}</Text>
          <Text style={styles.role}>Service Operator</Text>
        </View>
      </View>

      {/* Availability toggle */}
      <View style={styles.availCard}>
        <View style={styles.availLeft}>
          <MaterialIcons
            name={available ? "check-circle" : "pause-circle-outline"}
            size={22}
            color={available ? "#22C55E" : theme.textMuted}
          />
          <View style={styles.availText}>
            <Text style={styles.availTitle}>
              {available ? "Available for work" : "Not available"}
            </Text>
            <Text style={styles.availSub}>
              {available
                ? "You will receive new job notifications"
                : "You won't be notified about new jobs"}
            </Text>
          </View>
        </View>
        <Switch
          value={available}
          onValueChange={handleToggleAvailability}
          trackColor={{ false: theme.border, true: "#22C55E44" }}
          thumbColor={available ? "#22C55E" : theme.textMuted}
          disabled={togglingAvailability}
        />
      </View>

      {/* Menu */}
      <View style={styles.section}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as never)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name={item.icon} size={20} color={theme.textSecondary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.7}>
        <MaterialIcons name="logout" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
    name: { fontSize: 18, fontWeight: "700", color: t.text },
    role: { fontSize: 13, color: "#F59E0B", fontWeight: "500", marginTop: 2 },
    availCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 16,
      padding: 16,
      backgroundColor: t.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      marginBottom: 20,
    },
    availLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    availText: { flex: 1 },
    availTitle: { fontSize: 14, fontWeight: "600", color: t.text },
    availSub: { fontSize: 12, color: t.textSecondary, marginTop: 2, lineHeight: 16 },
    section: {
      marginHorizontal: 16,
      backgroundColor: t.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      marginBottom: 20,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      gap: 14,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: t.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 14, fontWeight: "600", color: t.text },
    menuSub: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
    signOut: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginHorizontal: 16,
      padding: 16,
      backgroundColor: "#EF444412",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#EF444430",
    },
    signOutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  });
}
