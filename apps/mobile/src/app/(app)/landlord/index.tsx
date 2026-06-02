import { useAuthStore } from "@/store/auth-store";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Semantic colours are identical in both themes — safe to hoist as constants
const ACCENT  = "#7C6CFF";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const ERROR   = "#EF4444";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type MIName = React.ComponentProps<typeof MaterialIcons>["name"];

interface MetricDef {
  icon: MIName;
  iconColor: string;
  value: string;
  label: string;
  sub: string;
}

interface ActionDef {
  icon: MIName;
  label: string;
  route: string;
}

interface ActivityDef {
  icon: MIName;
  desc: string;
  time: string;
  color: string;
}

// Static placeholder data — replace with real API calls
const METRICS: MetricDef[] = [
  { icon: "calendar-today",         iconColor: ACCENT,   value: "8",      label: "Bookings",  sub: "upcoming"    },
  { icon: "chat",                   iconColor: SUCCESS,  value: "3",      label: "Messages",  sub: "unread"      },
  { icon: "account-balance-wallet", iconColor: WARNING,  value: "£2,450", label: "Payments",  sub: "this month"  },
  { icon: "alarm",                  iconColor: ERROR,    value: "2",      label: "Reminders", sub: "outstanding" },
];

const ACTIONS: ActionDef[] = [
  { icon: "event-available", label: "Add\nBooking",    route: "/(account)/booking-requests"  },
  { icon: "add-home",        label: "Add\nProperty",   route: "/properties/create-property"  },
  { icon: "attach-money",    label: "Record\nPayment", route: "/(account)/earnings"          },
  { icon: "send",            label: "Message\nGuest",  route: "/(account)/messages"          },
];

const ACTIVITY: ActivityDef[] = [
  { icon: "account-balance-wallet", desc: "Payment received from John D.", time: "2h ago", color: SUCCESS },
  { icon: "event",                  desc: "New booking: Sea View Villa",    time: "4h ago", color: ACCENT  },
  { icon: "chat",                   desc: "Message from Sarah M.",          time: "6h ago", color: WARNING },
  { icon: "check-circle",           desc: "Reminder completed: Clean apt.", time: "1d ago", color: SUCCESS },
];

// ── Sub-component ──────────────────────────────────────────────────────────

type Styles = ReturnType<typeof createStyles>;

function MetricCard({ m, styles }: { m: MetricDef; styles: Styles }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricCardHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: m.iconColor + "22" }]}>
          <MaterialIcons name={m.icon} size={18} color={m.iconColor} />
        </View>
        <Text style={styles.metricLabel}>{m.label}</Text>
      </View>
      <Text style={styles.metricValue}>{m.value}</Text>
      <Text style={styles.metricSub}>{m.sub}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function LandlordDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile } = useAuthStore();
  const firstName = profile?.first_name ?? "there";
  const initial = (firstName[0] ?? "?").toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.nameText}>{firstName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityLabel="Notifications"
            onPress={() => router.push("/(account)/notifications")}
          >
            <MaterialIcons name="notifications" size={21} color={theme.textSub} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(account)/profile")}
            accessibilityLabel="Profile"
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Upcoming Booking */}
        <Text style={styles.sectionLabel}>UPCOMING BOOKING</Text>
        <View style={styles.bookingCard}>
          <View style={styles.bookingThumb}>
            <MaterialIcons name="home" size={44} color={theme.textMuted} />
          </View>
          <View style={styles.bookingBody}>
            <View style={styles.bookingTopRow}>
              <Text style={styles.bookingProperty}>Seafront Cottage</Text>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>Confirmed</Text>
              </View>
            </View>
            <Text style={styles.bookingGuest}>Sarah Mitchell</Text>
            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <MaterialIcons name="login" size={13} color={theme.textMuted} />
                <Text style={styles.dateCaption}>Check-in</Text>
                <Text style={styles.dateValue}>20 Dec</Text>
              </View>
              <View style={styles.dateSep} />
              <View style={styles.dateItem}>
                <MaterialIcons name="logout" size={13} color={theme.textMuted} />
                <Text style={styles.dateCaption}>Check-out</Text>
                <Text style={styles.dateValue}>27 Dec</Text>
              </View>
            </View>
          </View>
        </View>

        {/* At a Glance — 2×2 metrics */}
        <Text style={styles.sectionLabel}>AT A GLANCE</Text>
        <View style={styles.metricsRow}>
          {METRICS.slice(0, 2).map((m) => (
            <MetricCard key={m.label} m={m} styles={styles} />
          ))}
        </View>
        <View style={[styles.metricsRow, { marginTop: 12 }]}>
          {METRICS.slice(2).map((m) => (
            <MetricCard key={m.label} m={m} styles={styles} />
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          {ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionBtn}
              onPress={() => router.push(a.route as any)}
              accessibilityLabel={a.label.replace("\n", " ")}
            >
              <View style={styles.actionIconWrap}>
                <MaterialIcons name={a.icon} size={22} color={theme.accent} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
        <View style={styles.activityCard}>
          {ACTIVITY.map((a, i) => (
            <View
              key={i}
              style={[
                styles.activityItem,
                i < ACTIVITY.length - 1 && styles.activityDivider,
              ]}
            >
              <View style={[styles.activityIconWrap, { backgroundColor: a.color + "22" }]}>
                <MaterialIcons name={a.icon} size={16} color={a.color} />
              </View>
              <Text style={styles.activityDesc} numberOfLines={1}>
                {a.desc}
              </Text>
              <Text style={styles.activityTime}>{a.time}</Text>
            </View>
          ))}
        </View>

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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
    },
    greetingText: {
      fontSize: 13,
      color: t.textMuted,
      letterSpacing: 0.2,
    },
    nameText: {
      fontSize: 22,
      fontWeight: "700",
      color: t.text,
      marginTop: 1,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
    notifDot: {
      position: "absolute",
      top: 9,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: t.error,
      borderWidth: 1.5,
      borderColor: t.bg,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitial: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
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
    bookingCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
    },
    bookingThumb: {
      height: 130,
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
      fontSize: 17,
      fontWeight: "700",
      color: t.text,
    },
    confirmedBadge: {
      backgroundColor: SUCCESS + "22",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: SUCCESS + "55",
    },
    confirmedText: {
      fontSize: 11,
      fontWeight: "600",
      color: SUCCESS,
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
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 6,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: t.accent + "22",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    actionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: t.textSub,
      textAlign: "center",
      lineHeight: 15,
    },
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
