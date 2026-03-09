import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { colours, supabase } from "@kiado/shared";
import { useAuthStore } from "@/store/auth-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type NotificationPrefs = {
  new_booking: boolean;
  booking_confirmed: boolean;
  booking_cancelled: boolean;
  new_message: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  new_booking: true,
  booking_confirmed: true,
  booking_cancelled: true,
  new_message: true,
};

export default function NotificationsScreen() {
  const { profile } = useAuthStore();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const isLandlord = profile?.user_role === "landlord";

  useEffect(() => {
    checkPermission();
    loadPrefs();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === "granted");
  };

  const loadPrefs = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", profile.id)
        .single();

      if (!error && data?.notification_prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs });
      }
    } catch (e) {
      console.error("[Notifications] Failed to load prefs:", e);
    } finally {
      setLoading(false);
    }
  };

  const savePrefs = async (updated: NotificationPrefs) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_prefs: updated })
        .eq("id", profile.id);

      if (error) throw error;
    } catch (e) {
      console.error("[Notifications] Failed to save prefs:", e);
      Alert.alert("Error", "Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    savePrefs(updated);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colours.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Permission banner */}
      {permissionGranted === false && (
        <View style={styles.banner}>
          <MaterialIcons
            name="notifications-off"
            size={20}
            color={colours.warning}
          />
          <Text style={styles.bannerText}>
            Push notifications are disabled. Enable them in Settings to receive
            alerts.
          </Text>
          <Text
            style={styles.bannerLink}
            onPress={() => Linking.openSettings()}
          >
            Open Settings
          </Text>
        </View>
      )}

      {/* Messages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <NotificationRow
          icon="chat"
          label="New Message"
          description="When someone sends you a message"
          value={prefs.new_message}
          onToggle={() => toggle("new_message")}
          disabled={saving || permissionGranted === false}
        />
      </View>

      {/* Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookings</Text>

        {isLandlord && (
          <NotificationRow
            icon="home"
            label="New Booking Request"
            description="When a tenant requests to book your property"
            value={prefs.new_booking}
            onToggle={() => toggle("new_booking")}
            disabled={saving || permissionGranted === false}
          />
        )}

        <NotificationRow
          icon="check-circle"
          label="Booking Confirmed"
          description="When your booking is confirmed"
          value={prefs.booking_confirmed}
          onToggle={() => toggle("booking_confirmed")}
          disabled={saving || permissionGranted === false}
        />

        <NotificationRow
          icon="cancel"
          label="Booking Cancelled"
          description="When a booking is cancelled"
          value={prefs.booking_cancelled}
          onToggle={() => toggle("booking_cancelled")}
          disabled={saving || permissionGranted === false}
        />
      </View>
    </ScrollView>
  );
}

type RowProps = {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

function NotificationRow({
  icon,
  label,
  description,
  value,
  onToggle,
  disabled,
}: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={22} color={colours.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colours.border, true: colours.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colours.background,
  },
  banner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    backgroundColor: colours.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colours.warning,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: colours.text,
    lineHeight: 18,
  },
  bannerLink: {
    fontSize: 13,
    color: colours.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colours.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 13,
    color: colours.muted,
    lineHeight: 18,
  },
});
