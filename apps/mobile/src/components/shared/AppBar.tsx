import { useAuthStore } from "@/store/auth-store";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import {
  fetchNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/utils/booking-utils";
import { Notification } from "@kiado/shared/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

const logoImg = require("@kiado/shared/assets/images/kiado-logo.png");

type MIName = React.ComponentProps<typeof MaterialIcons>["name"];

function notifIcon(type: Notification["type"]): { icon: MIName; color: string } {
  switch (type) {
    case "booking_request":   return { icon: "event",                   color: "#F59E0B" };
    case "booking_confirmed": return { icon: "check-circle",            color: "#22C55E" };
    case "booking_cancelled": return { icon: "cancel",                  color: "#EF4444" };
    case "payment":           return { icon: "account-balance-wallet",  color: "#22C55E" };
    case "message":           return { icon: "chat",                    color: "#7C6CFF" };
    default:                  return { icon: "info",                    color: "#94A3B8" };
  }
}


function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Animated notification item ─────────────────────────────────────────────

function NotifItem({
  n,
  isLast,
  onDismiss,
  styles,
  theme,
}: {
  n: Notification;
  isLast: boolean;
  onDismiss: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  const { icon, color } = notifIcon(n.type);
  const [dotVisible, setDotVisible] = useState(true);
  const measuredHeight  = useRef(0);
  const darkOverlay     = useRef(new Animated.Value(0)).current;
  const translateX      = useRef(new Animated.Value(0)).current;
  const itemOpacity     = useRef(new Animated.Value(1)).current;
  const wrapperHeight   = useRef(new Animated.Value(1)).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    if (measuredHeight.current === 0) {
      measuredHeight.current = e.nativeEvent.layout.height;
    }
  };

  const handlePress = () => {
    setDotVisible(false);
    // 1. Darken
    Animated.timing(darkOverlay, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      // 2. Brief pause, then slide out + fade
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 420,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(itemOpacity, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // 3. Collapse height so the list closes up
          Animated.timing(wrapperHeight, {
            toValue: 0,
            duration: 220,
            useNativeDriver: false,
          }).start(() => onDismiss());
        });
      }, 500);
    });
  };

  const heightStyle = {
    height: wrapperHeight.interpolate({
      inputRange:  [0, 1],
      outputRange: [0, measuredHeight.current || 64],
    }),
    overflow: "hidden" as const,
  };

  const bgColor = darkOverlay.interpolate({
    inputRange:  [0, 1],
    outputRange: [theme.accent + "0D", theme.accent + "33"],
  });

  return (
    <Animated.View style={heightStyle}>
      <Animated.View
        onLayout={handleLayout}
        style={[
          styles.item,
          !isLast && styles.itemDivider,
          { backgroundColor: bgColor, transform: [{ translateX }], opacity: itemOpacity },
        ]}
      >
        <TouchableOpacity
          style={styles.itemInner}
          onPress={handlePress}
          activeOpacity={1}
        >
          <View style={[styles.itemIcon, { backgroundColor: color + "22" }]}>
            <MaterialIcons name={icon} size={18} color={color} />
          </View>
          <View style={styles.itemBody}>
            <Text style={styles.itemTitle} numberOfLines={1}>{n.title}</Text>
            <Text style={styles.itemMessage} numberOfLines={2}>{n.message}</Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemTime}>{relativeTime(n.created_at)}</Text>
            {dotVisible && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ── AppBar ──────────────────────────────────────────────────────────────────

export default function AppBar({ backgroundColor }: { backgroundColor?: string } = {}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bg = backgroundColor ?? theme.surface;
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();

  const [notifCount, setNotifCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user?.id) return;
      getUnreadNotificationCount(session.user.id).then(setNotifCount).catch(() => {});
    }, [session?.user?.id]),
  );

  const openPanel = async () => {
    if (!session?.user?.id) return;
    setPanelOpen(true);
    setLoading(true);
    try {
      const data = await fetchNotifications(session.user.id);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  const handleTap = (n: Notification) => {
    if (n.read) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
    setNotifCount((c) => Math.max(0, c - 1));
    markNotificationAsRead(n.id).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    if (!session?.user?.id) return;
    await markAllNotificationsAsRead(session.user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotifCount(0);
  };

  const unread    = notifications.filter((n) => !n.read);
  const hasUnread = unread.length > 0;
  const panelTop  = insets.top + 56;

  return (
    <>
      <View style={[styles.appBar, { backgroundColor: bg }]}>
        <View style={styles.content}>
          <Image
            source={logoImg}
            style={styles.logo}
            contentFit="contain"
            tintColor={theme.text}
          />
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={openPanel}
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="notifications-none" size={24} color={theme.text} />
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifCount > 99 ? "99+" : notifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Notification dropdown ── */}
      <Modal
        visible={panelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPanelOpen(false)}
      >
        {/*
          The overlay and the panel are SIBLINGS inside an absolute-fill
          container. This means the ScrollView inside the panel is never
          wrapped in a touch interceptor, so it scrolls freely.
        */}
        <View style={styles.modalRoot}>
          {/* Tap outside to dismiss */}
          <Pressable style={styles.overlay} onPress={() => setPanelOpen(false)} />

          {/* Panel — no touch wrapper, sits above the overlay */}
          <View style={[styles.panel, { top: panelTop }]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Notifications</Text>
              {hasUnread && (
                <TouchableOpacity onPress={handleMarkAllRead}>
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            ) : unread.length === 0 ? (
              <View style={styles.centered}>
                <MaterialIcons name="notifications-none" size={40} color={theme.textMuted} />
                <Text style={styles.emptyText}>You're all caught up</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                {unread.map((n, i) => (
                  <NotifItem
                    key={n.id}
                    n={n}
                    isLast={i === unread.length - 1}
                    onDismiss={() => handleTap(n)}
                    styles={styles}
                    theme={theme}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    appBar: {
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    content: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    logo: {
      height: 32,
      width: 120,
    },
    notifBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: t.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: t.surface,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },

    // Modal layout
    modalRoot: {
      flex: 1,
    },
    overlay: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    panel: {
      position: "absolute",
      left: 16,
      right: 16,
      maxHeight: 420,
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    panelHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: t.text,
    },
    markAllText: {
      fontSize: 12,
      fontWeight: "600",
      color: t.accent,
    },
    centered: {
      padding: 32,
      alignItems: "center",
      gap: 10,
    },
    emptyText: {
      fontSize: 13,
      color: t.textMuted,
    },
    item: {
      overflow: "hidden",
    },
    itemInner: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 12,
    },
    itemUnread: {
      backgroundColor: t.accent + "0D",
    },
    itemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    itemIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    itemBody: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: t.text,
      marginBottom: 2,
    },
    itemMessage: {
      fontSize: 12,
      color: t.textSub,
      lineHeight: 16,
    },
    itemRight: {
      alignItems: "flex-end",
      gap: 6,
      flexShrink: 0,
      marginTop: 1,
    },
    itemTime: {
      fontSize: 11,
      color: t.textMuted,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: t.accent,
    },
  });
}
