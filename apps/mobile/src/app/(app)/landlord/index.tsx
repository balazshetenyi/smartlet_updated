import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { fetchBookingRequests } from "@/utils/booking-utils";
import { fetchTotalUnreadCount } from "@/utils/message-utils";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@kiado/shared";
import { BookingWithTenant } from "@kiado/shared/types/bookings";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Semantic colours are identical in both themes — safe to hoist as constants
const ACCENT = "#7C6CFF";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const ERROR = "#EF4444";

type MIName = React.ComponentProps<typeof MaterialIcons>["name"];

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ActivityItem {
  icon: MIName;
  color: string;
  desc: string;
  time: string;
}

function bookingToActivity(b: BookingWithTenant): ActivityItem {
  const guest = `${b.tenant.first_name} ${b.tenant.last_name}`;
  const prop = b.property.title;

  if (b.status === "confirmed" && b.payment_status === "paid") {
    return {
      icon: "account-balance-wallet",
      color: SUCCESS,
      desc: `Payment received from ${guest}`,
      time: relativeTime(b.updated_at),
    };
  }
  if (b.status === "confirmed") {
    return {
      icon: "check-circle",
      color: ACCENT,
      desc: `Booking confirmed · ${prop}`,
      time: relativeTime(b.updated_at),
    };
  }
  if (b.status === "cancelled") {
    return {
      icon: "cancel",
      color: ERROR,
      desc: `Booking cancelled · ${guest}`,
      time: relativeTime(b.updated_at),
    };
  }
  if (b.status === "completed") {
    return {
      icon: "done-all",
      color: SUCCESS,
      desc: `Stay completed · ${guest}`,
      time: relativeTime(b.updated_at),
    };
  }
  // pending
  return {
    icon: "event",
    color: WARNING,
    desc: `New request from ${guest} · ${prop}`,
    time: relativeTime(b.created_at),
  };
}

// ── Sub-component ──────────────────────────────────────────────────────────

type Styles = ReturnType<typeof createStyles>;

function MetricCard({
  icon,
  iconColor,
  value,
  label,
  sub,
  onPress,
  styles,
}: {
  icon: MIName;
  iconColor: string;
  value: string;
  label: string;
  sub: string;
  onPress: () => void;
  styles: Styles;
}) {
  return (
    <TouchableOpacity
      style={styles.metricCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.metricCardHeader}>
        <View
          style={[styles.metricIconWrap, { backgroundColor: iconColor + "22" }]}
        >
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function LandlordDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile, session } = useAuthStore();

  const [bookings, setBookings] = useState<BookingWithTenant[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [monthlyPayout, setMonthlyPayout] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id || !session?.user?.id) return;

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const [allBookings, unread, paymentsResult] = await Promise.all([
      fetchBookingRequests(profile.id),
      fetchTotalUnreadCount(session.user.id),
      supabase
        .from("bookings")
        .select("total_price, property:properties!inner(landlord_id)")
        .eq("property.landlord_id", profile.id)
        .eq("payment_status", "paid")
        .gte("created_at", startOfMonth),
    ]);

    setBookings(allBookings);
    setUnreadMessages(unread);
    const payout = (paymentsResult.data ?? []).reduce(
      (sum: number, b: any) => sum + (b.total_price ?? 0) * 0.94,
      0,
    );
    setMonthlyPayout(payout);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const now = new Date();

  const isExpired = (b: BookingWithTenant) => {
    if (now >= new Date(b.check_in)) return true;
    const expiresAt = new Date(new Date(b.created_at!).getTime() + 48 * 60 * 60 * 1000);
    return now >= expiresAt;
  };

  const upcomingBooking = useMemo(
    () =>
      [...bookings]
        .filter(
          (b) =>
            (b.status === "confirmed" || b.status === "pending") &&
            new Date(b.check_in) > now,
        )
        .sort(
          (a, b) =>
            new Date(a.check_in).getTime() - new Date(b.check_in).getTime(),
        )[0] ?? null,
    [bookings],
  );

  const upcomingCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (b.status === "confirmed" || b.status === "pending") &&
          new Date(b.check_in) > now,
      ).length,
    [bookings],
  );

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === "pending" && !isExpired(b)).length,
    [bookings],
  );

  const recentActivity: ActivityItem[] = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .slice(0, 4)
        .map(bookingToActivity),
    [bookings],
  );

  const payoutFormatted =
    monthlyPayout > 0 ? `£${monthlyPayout.toFixed(0)}` : "£0";

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
      >
        {/* ── Upcoming Booking ── */}
        <Text style={styles.sectionLabel}>UPCOMING BOOKING</Text>
        {upcomingBooking ? (
          <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => router.push("/(account)/booking-requests")}
            activeOpacity={0.85}
          >
            {upcomingBooking.property.cover_image_url ? (
              <Image
                source={{ uri: upcomingBooking.property.cover_image_url }}
                style={styles.bookingThumb}
                contentFit="cover"
              />
            ) : (
              <View
                style={[styles.bookingThumb, styles.bookingThumbPlaceholder]}
              >
                <MaterialIcons name="home" size={44} color={theme.textMuted} />
              </View>
            )}
            <View style={styles.bookingBody}>
              <View style={styles.bookingTopRow}>
                <Text style={styles.bookingProperty} numberOfLines={1}>
                  {upcomingBooking.property.title}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        (upcomingBooking.status === "confirmed"
                          ? SUCCESS
                          : WARNING) + "22",
                      borderColor:
                        (upcomingBooking.status === "confirmed"
                          ? SUCCESS
                          : WARNING) + "55",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          upcomingBooking.status === "confirmed"
                            ? SUCCESS
                            : WARNING,
                      },
                    ]}
                  >
                    {upcomingBooking.status.charAt(0).toUpperCase() +
                      upcomingBooking.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.bookingGuest}>
                {upcomingBooking.tenant.first_name}{" "}
                {upcomingBooking.tenant.last_name}
              </Text>
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <MaterialIcons
                    name="login"
                    size={13}
                    color={theme.textMuted}
                  />
                  <Text style={styles.dateCaption}>Check-in</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(upcomingBooking.check_in)}
                  </Text>
                </View>
                <View style={styles.dateSep} />
                <View style={styles.dateItem}>
                  <MaterialIcons
                    name="logout"
                    size={13}
                    color={theme.textMuted}
                  />
                  <Text style={styles.dateCaption}>Check-out</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(upcomingBooking.check_out)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons
              name="event-available"
              size={32}
              color={theme.textMuted}
            />
            <Text style={styles.emptyCardText}>No upcoming bookings</Text>
          </View>
        )}

        {/* ── At a Glance ── */}
        <Text style={styles.sectionLabel}>AT A GLANCE</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            icon="calendar-today"
            iconColor={ACCENT}
            value={String(upcomingCount)}
            label="Bookings"
            sub="upcoming"
            onPress={() => router.push("/landlord/bookings")}
            styles={styles}
          />
          <MetricCard
            icon="chat"
            iconColor={SUCCESS}
            value={String(unreadMessages)}
            label="Messages"
            sub="unread"
            onPress={() => router.push("/landlord/messages")}
            styles={styles}
          />
        </View>
        <View style={[styles.metricsRow, { marginTop: 12 }]}>
          <MetricCard
            icon="account-balance-wallet"
            iconColor={WARNING}
            value={payoutFormatted}
            label="Earnings"
            sub="this month"
            onPress={() => router.push("/(account)/earnings")}
            styles={styles}
          />
          <MetricCard
            icon="pending-actions"
            iconColor={ERROR}
            value={String(pendingCount)}
            label="Pending"
            sub="need action"
            onPress={() => router.push("/landlord/bookings?filter=pending")}
            styles={styles}
          />
        </View>

        {/* ── Recent Activity ── */}
        <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
        {recentActivity.length > 0 ? (
          <View style={styles.activityCard}>
            {recentActivity.map((a, i) => (
              <View
                key={i}
                style={[
                  styles.activityItem,
                  i < recentActivity.length - 1 && styles.activityDivider,
                ]}
              >
                <View
                  style={[
                    styles.activityIconWrap,
                    { backgroundColor: a.color + "22" },
                  ]}
                >
                  <MaterialIcons name={a.icon} size={16} color={a.color} />
                </View>
                <Text style={styles.activityDesc} numberOfLines={1}>
                  {a.desc}
                </Text>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons name="history" size={32} color={theme.textMuted} />
            <Text style={styles.emptyCardText}>No recent activity</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles factory ─────────────────────────────────────────────────────────

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: t.text,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: t.textMuted,
      letterSpacing: 1.2,
      marginTop: 24,
      marginBottom: 12,
    },

    // Upcoming booking card
    bookingCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
    },
    bookingThumb: {
      height: 130,
      width: "100%",
    },
    bookingThumbPlaceholder: {
      backgroundColor: t.bg2,
      justifyContent: "center",
      alignItems: "center",
    },
    bookingBody: {
      padding: 16,
    },
    bookingTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    bookingProperty: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: t.text,
      marginRight: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
    },
    bookingGuest: {
      fontSize: 14,
      color: t.textSub,
      marginBottom: 12,
    },
    datesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    dateItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    dateCaption: {
      fontSize: 11,
      color: t.textMuted,
    },
    dateValue: {
      fontSize: 13,
      fontWeight: "600",
      color: t.textSub,
    },
    dateSep: {
      width: 1,
      height: 14,
      backgroundColor: t.border,
    },
    emptyCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    emptyCardText: {
      fontSize: 13,
      color: t.textMuted,
    },

    // Metrics
    metricsRow: {
      flexDirection: "row",
      gap: 12,
    },
    metricCard: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    metricCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    metricIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    metricValue: {
      fontSize: 22,
      fontWeight: "700",
      color: t.text,
      marginBottom: 1,
    },
    metricLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: t.textSub,
    },
    metricSub: {
      fontSize: 11,
      color: t.textMuted,
      marginTop: 2,
    },

    // Activity feed
    activityCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
    },
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 14,
      gap: 12,
    },
    activityDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    activityIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    activityDesc: {
      flex: 1,
      fontSize: 13,
      color: t.textSub,
    },
    activityTime: {
      fontSize: 11,
      color: t.textMuted,
      flexShrink: 0,
    },
  });
}
