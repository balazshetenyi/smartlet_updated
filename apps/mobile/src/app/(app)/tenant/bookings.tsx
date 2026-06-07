import Button from "@/components/shared/Button";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { cancelBooking, fetchMyBookings } from "@/utils/booking-utils";
import { PropertyImage } from "@/components/properties/PropertyImage";
import { Card } from "@/components/shared/Card";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { showToastMessage } from "@/components/shared/ToastMessage";
import { BookingWithProperty } from "@kiado/shared/types/bookings";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterKey = "upcoming" | "past";

export default function BookingsTab() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { showActionSheetWithOptions } = useActionSheet();
  const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!profile?.id) return;
    try {
      const data = await fetchMyBookings(profile.id);
      setBookings(data);
    } catch {
      showToastMessage({ message: "Failed to load bookings", type: "danger" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [profile?.id]));

  const now = new Date();

  const filtered = useMemo(() => {
    if (filter === "upcoming") {
      return bookings.filter(
        (b) => (b.status === "pending" || b.status === "confirmed") && new Date(b.check_out) >= now,
      );
    }
    return bookings.filter(
      (b) => b.status === "cancelled" || b.status === "completed" || new Date(b.check_out) < now,
    );
  }, [bookings, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return theme.success;
      case "pending":   return theme.warning;
      case "cancelled": return theme.danger;
      default:          return theme.muted;
    }
  };

  const handleCancel = (booking: BookingWithProperty) => {
    const canCancel = booking.status === "confirmed" || booking.payment_status === "due" || booking.payment_status === "paid";
    showActionSheetWithOptions(
      {
        title: canCancel ? "Cancel Booking" : "Cancel Request",
        message: canCancel
          ? "Are you sure? Cancellation fees may apply."
          : "Are you sure you want to cancel this request?",
        options: ["Keep", canCancel ? "Cancel Booking" : "Cancel Request"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      async (idx) => {
        if (idx !== 1) return;
        const { ok, error } = await cancelBooking(booking.id);
        if (ok) {
          showToastMessage({ message: "Booking cancelled", type: "success" });
          load();
        } else {
          showToastMessage({ message: error ?? "Failed to cancel", type: "danger" });
        }
      },
    );
  };

  const renderCard = ({ item }: { item: BookingWithProperty }) => {
    const checkIn  = new Date(item.check_in);
    const checkOut = new Date(item.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const canCancel = item.status === "pending" || item.status === "confirmed";

    return (
      <Card>
        {item.property?.cover_image_url && (
          <PropertyImage uri={item.property.cover_image_url} />
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.propertyTitle} numberOfLines={1}>{item.property?.title}</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + "22" }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {item.property?.city && (
            <Text style={styles.location}>
              <MaterialIcons name="location-on" size={13} color={theme.textMuted} /> {item.property.city}
            </Text>
          )}

          <View style={styles.datesRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>
                {checkIn.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </Text>
            </View>
            <View style={styles.dateSep} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>
                {checkOut.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.price}>£{item.total_price.toLocaleString()}</Text>
            <Text style={styles.nights}>{nights} {nights === 1 ? "night" : "nights"}</Text>
          </View>

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past",     label: "Past" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="event-available" size={56} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>
            {filter === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </Text>
          {filter === "upcoming" && (
            <Button
              title="Explore Properties"
              onPress={() => router.push("/tenant")}
              buttonStyle={styles.exploreBtn}
            />
          )}
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filtered}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={theme.accent}
            />
          }
        />
      )}
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: t.bg },
    header:     { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
    title:      { fontSize: 22, fontWeight: "700", color: t.text },
    filterRow:  { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
    pill: {
      paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    },
    pillActive:    { backgroundColor: t.accent, borderColor: t.accent },
    pillText:      { fontSize: 13, fontWeight: "600", color: t.textSub },
    pillTextActive: { color: "#FFFFFF" },
    centered:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: t.text, marginTop: 16, marginBottom: 20 },
    exploreBtn: { backgroundColor: t.accent, paddingHorizontal: 24 },
    list:       { flex: 1, backgroundColor: t.bg },
    listContent: { padding: 16, paddingBottom: 32 },
    cardBody:   { padding: 16 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    propertyTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: t.text, marginRight: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: "600" },
    location: { fontSize: 13, color: t.textMuted, marginBottom: 12 },
    datesRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    dateBlock: { flex: 1 },
    dateLabel: { fontSize: 11, color: t.textMuted, marginBottom: 2 },
    dateValue: { fontSize: 13, fontWeight: "600", color: t.text },
    dateSep: { width: 1, height: 32, backgroundColor: t.border },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    price: { fontSize: 18, fontWeight: "700", color: t.primary },
    nights: { fontSize: 13, color: t.textMuted },
    cancelBtn: {
      marginTop: 12, paddingVertical: 10, borderRadius: 10,
      borderWidth: 1, borderColor: t.danger + "66", alignItems: "center",
    },
    cancelText: { fontSize: 13, fontWeight: "600", color: t.danger },
  });
}
