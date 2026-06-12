import { PropertyImage } from "@/components/properties/PropertyImage";
import Button from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { showToastMessage } from "@/components/shared/ToastMessage";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { fetchBookingRequests } from "@/utils/booking-utils";
import { useActionSheet } from "@expo/react-native-action-sheet";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { isBookingRequestExpired, supabase } from "@kiado/shared";
import { BookingWithTenant } from "@kiado/shared/types/bookings";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BookingsTab() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { showActionSheetWithOptions } = useActionSheet();
  const listRef = useRef<FlatList<BookingWithTenant>>(null);
  const [bookings, setBookings] = useState<BookingWithTenant[]>([]);
  const { filter: filterParam, bookingId: targetId } =
    useLocalSearchParams<{ filter?: string; bookingId?: string }>();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "past">(
    filterParam === "pending" || filterParam === "confirmed" || filterParam === "past"
      ? filterParam
      : "all",
  );

  // Sync filter when navigating to this tab with a ?filter= param
  useEffect(() => {
    if (filterParam === "pending" || filterParam === "confirmed" || filterParam === "past") {
      setFilter(filterParam);
    }
  }, [filterParam]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!profile?.id) return;
    try {
      const data = await fetchBookingRequests(profile.id);
      setBookings(data);
    } catch (error) {
      console.error("Error loading booking requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [profile?.id]),
  );

  const isExpired = (b: BookingWithTenant) => isBookingRequestExpired(b);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return theme.success;
      case "pending":
        return theme.warning;
      case "declined":
      case "cancelled":
        return theme.danger;
      case "completed":
        return theme.muted;
      default:
        return theme.textSecondary;
    }
  };

  const handleConfirm = (bookingId: string) => {
    showActionSheetWithOptions(
      {
        title: "Confirm Booking",
        message: "Are you sure? This will charge the tenant's payment method.",
        options: ["Cancel", "Confirm"],
        cancelButtonIndex: 0,
      },
      async (idx) => {
        if (idx !== 1) return;
        try {
          const { error } = await supabase.functions.invoke(
            "confirm-booking-manual",
            {
              body: { bookingId },
            },
          );
          if (error) throw error;
          showToastMessage({
            message: "Booking confirmed and payment processed",
            type: "success",
          });
          setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          load();
        } catch {
          showToastMessage({
            message: "Failed to confirm booking",
            type: "danger",
          });
        }
      },
    );
  };

  const handleDecline = (bookingId: string) => {
    showActionSheetWithOptions(
      {
        title: "Decline Booking",
        message: "Are you sure you want to decline this booking request?",
        options: ["Keep Request", "Decline"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      async (idx) => {
        if (idx !== 1) return;
        try {
          const { error } = await supabase.functions.invoke("decline-booking", {
            body: { bookingId },
          });
          if (error) throw error;
          showToastMessage({ message: "Booking declined", type: "success" });
          setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          load();
        } catch {
          showToastMessage({
            message: "Failed to decline booking",
            type: "danger",
          });
        }
      },
    );
  };

  const renderCard = ({ item }: { item: BookingWithTenant }) => {
    const checkIn = new Date(item.check_in);
    const checkOut = new Date(item.check_out);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    const expired = isExpired(item);

    const paymentBadge =
      item.payment_status === "paid"
        ? { icon: "check-circle" as const, color: theme.success, label: "Paid" }
        : item.payment_status === "due"
          ? {
              icon: "schedule" as const,
              color: theme.warning,
              label: "Payment Due",
            }
          : null;

    return (
      <Card>
        {item.property?.cover_image_url && (
          <PropertyImage uri={item.property.cover_image_url} />
        )}
        <View style={styles.cardBody}>
          {/* Title + status */}
          <View style={styles.cardHeader}>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {item.property?.title}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: getStatusColor(item.status) + "22" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Guest */}
          <View style={styles.guestRow}>
            {item.tenant?.avatar_url ? (
              <Image
                source={{ uri: item.tenant.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={20} color={theme.muted} />
              </View>
            )}
            <View>
              <Text style={styles.guestLabel}>Guest</Text>
              <Text style={styles.guestName}>
                {item.tenant?.first_name} {item.tenant?.last_name}
              </Text>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateBlock}>
              <MaterialIcons name="login" size={18} color={theme.primary} />
              <View>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>
                  {checkIn.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.dateBlock}>
              <MaterialIcons name="logout" size={18} color={theme.danger} />
              <View>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>
                  {checkOut.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricing}>
            <View style={styles.pricingTop}>
              <Text style={styles.nights}>
                {nights} {nights === 1 ? "night" : "nights"}
              </Text>
              {paymentBadge && (
                <View style={styles.paymentBadge}>
                  <MaterialIcons
                    name={paymentBadge.icon}
                    size={14}
                    color={paymentBadge.color}
                  />
                  <Text
                    style={[
                      styles.paymentBadgeText,
                      { color: paymentBadge.color },
                    ]}
                  >
                    {paymentBadge.label}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Booking total</Text>
              <Text style={styles.priceValue}>
                £{item.total_price.toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Kiado fee (6%)</Text>
              <Text style={[styles.priceValue, { color: theme.danger }]}>
                −£{(item.total_price * 0.06).toFixed(2)}
              </Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Your payout</Text>
              <Text style={styles.payoutValue}>
                £{(item.total_price * 0.94).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Actions for pending */}
          {item.status === "pending" &&
            (expired ? (
              <View style={styles.expiredRow}>
                <MaterialIcons name="schedule" size={15} color={theme.muted} />
                <Text style={styles.expiredText}>
                  {new Date() >= new Date(item.check_in)
                    ? "Check-in date has passed"
                    : "Request expired — no response within 48 hours"}
                </Text>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <Button
                  title="Decline"
                  type="outline"
                  onPress={() => handleDecline(item.id)}
                  buttonStyle={[
                    styles.actionBtn,
                    { borderColor: theme.danger },
                  ]}
                />
                <Button
                  title="Confirm Booking"
                  onPress={() => handleConfirm(item.id)}
                  buttonStyle={styles.actionBtn}
                />
              </View>
            ))}
        </View>
      </Card>
    );
  };

  const now = new Date();

  const isPast = (b: BookingWithTenant) =>
    b.status === "completed" ||
    b.status === "cancelled" ||
    (b.status === "pending"   && isExpired(b)) ||
    (b.status === "confirmed" && new Date(b.check_out) < now);

  const pendingCount = bookings.filter(
    (b) => b.status === "pending" && !isExpired(b),
  ).length;

  const confirmedCount = bookings.filter(
    (b) => b.status === "confirmed",
  ).length;

  const byCheckIn = (a: BookingWithTenant, b: BookingWithTenant) =>
    new Date(a.check_in).getTime() - new Date(b.check_in).getTime();

  const filteredBookings = useMemo(() => {
    if (filter === "pending")
      return bookings.filter((b) => b.status === "pending" && !isExpired(b)).sort(byCheckIn);
    if (filter === "confirmed")
      return bookings.filter((b) => b.status === "confirmed").sort(byCheckIn);
    if (filter === "past")
      return bookings.filter(isPast).sort((a, b) => byCheckIn(b, a));
    // "all" — active only, expired/past noise removed
    return bookings.filter((b) => !isPast(b)).sort(byCheckIn);
  }, [bookings, filter]);

  // Scroll to a specific booking when arriving from the activity feed.
  // scrolledToId prevents re-firing when the user changes filters while
  // the bookingId param is still in the URL.
  const scrolledToId = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId || filteredBookings.length === 0) return;
    if (scrolledToId.current === targetId) return;
    const index = filteredBookings.findIndex((b) => b.id === targetId);
    if (index === -1) return;
    scrolledToId.current = targetId;
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
    }, 350);
  }, [filteredBookings, targetId]);

  const FILTERS: { key: "all" | "pending" | "confirmed" | "past"; label: string; badge?: number }[] = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending",   badge: pendingCount   },
    { key: "confirmed", label: "Confirmed", badge: confirmedCount },
    { key: "past",      label: "Past" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      {/* Filter pills */}
      {!loading && bookings.length > 0 && (
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    active && styles.filterLabelActive,
                  ]}
                >
                  {f.label}
                </Text>
                {f.badge !== undefined && f.badge > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      active && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        active && styles.filterBadgeTextActive,
                      ]}
                    >
                      {f.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="inbox" size={56} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>
            {bookings.length === 0
              ? "No booking requests"
              : `No ${filter} bookings`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {bookings.length === 0
              ? "Booking requests from guests will appear here"
              : "Try a different filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          ref={listRef}
          data={filteredBookings}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.2,
              });
            }, 300);
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
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
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    filterPillActive: {
      backgroundColor: t.accent,
      borderColor: t.accent,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: t.textSub,
    },
    filterLabelActive: {
      color: "#FFFFFF",
    },
    filterBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: t.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    filterBadgeActive: {
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    filterBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: t.textSub,
    },
    filterBadgeTextActive: {
      color: "#FFFFFF",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: t.text,
      marginTop: 16,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: t.textMuted,
      textAlign: "center",
    },
    list: {
      flex: 1,
      backgroundColor: t.bg,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    cardBody: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    propertyTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: t.text,
      marginRight: 12,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    guestRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarPlaceholder: {
      backgroundColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
    guestLabel: {
      fontSize: 11,
      color: t.textMuted,
      marginBottom: 2,
    },
    guestName: {
      fontSize: 15,
      fontWeight: "600",
      color: t.text,
    },
    datesRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },
    dateBlock: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: t.bg2,
      padding: 10,
      borderRadius: 10,
    },
    dateLabel: {
      fontSize: 11,
      color: t.textMuted,
      marginBottom: 2,
    },
    dateValue: {
      fontSize: 13,
      fontWeight: "600",
      color: t.text,
    },
    pricing: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 14,
      marginBottom: 14,
      gap: 6,
    },
    pricingTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    nights: {
      fontSize: 13,
      color: t.textSub,
    },
    paymentBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    paymentBadgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    priceLabel: {
      fontSize: 13,
      color: t.textSub,
    },
    priceValue: {
      fontSize: 13,
      color: t.text,
    },
    payoutRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 8,
      marginTop: 4,
    },
    payoutLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: t.text,
    },
    payoutValue: {
      fontSize: 18,
      fontWeight: "700",
      color: t.success,
    },
    expiredRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    expiredText: {
      fontSize: 13,
      color: t.textMuted,
      fontStyle: "italic",
      flex: 1,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionBtn: {
      flex: 1,
    },
  });
}
