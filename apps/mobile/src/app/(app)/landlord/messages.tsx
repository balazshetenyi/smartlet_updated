import ConversationList from "@/components/messages/ConversationList";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { fetchBookingRequests } from "@/utils/booking-utils";
import { useActionSheet } from "@expo/react-native-action-sheet";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesTab() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { showActionSheetWithOptions } = useActionSheet();
  const [composing, setComposing] = useState(false);

  const handleCompose = async () => {
    if (!profile?.id) return;
    setComposing(true);

    try {
      const bookings = await fetchBookingRequests(profile.id);
      const now = new Date();
      const active = bookings.filter(
        (b) =>
          (b.status === "confirmed" || b.status === "pending") &&
          new Date(b.check_out) >= now,
      );

      if (active.length === 0) {
        showActionSheetWithOptions(
          {
            title: "No active guests",
            message: "You have no confirmed or pending bookings to message.",
            options: ["OK"],
            cancelButtonIndex: 0,
          },
          () => {},
        );
        return;
      }

      const options = [
        ...active.map(
          (b) =>
            `${b.tenant.first_name} ${b.tenant.last_name}  ·  ${b.property.title}`,
        ),
        "Cancel",
      ];

      showActionSheetWithOptions(
        {
          title: "Message a guest",
          options,
          cancelButtonIndex: options.length - 1,
        },
        (idx) => {
          if (idx === undefined || idx === options.length - 1) return;
          const booking = active[idx];
          router.push(
            `/messages/new?propertyId=${booking.property_id}&landlordId=${profile.id}&tenantId=${booking.tenant_id}&propertyTitle=${encodeURIComponent(booking.property.title)}` as any,
          );
        },
      );
    } finally {
      setComposing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={handleCompose}
          accessibilityLabel="New message"
          disabled={composing}
        >
          {composing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <MaterialIcons name="edit" size={20} color={theme.accent} />
          )}
        </TouchableOpacity>
      </View>
      <ConversationList />
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: t.text,
    },
    composeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
