import { useAuthStore } from "@/store/auth-store";
import { useMessageStore } from "@/store/message-store";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import {
  fetchTotalUnreadCount,
  subscribeToMessages,
} from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

const logoImg = require("@kiado/shared/assets/images/kiado-logo.png");

export default function AppBar() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuthStore();
  const { unreadCount, setUnreadCount, loadMessages } = useMessageStore();

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const count = await fetchTotalUnreadCount(session.user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [session?.user?.id, setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      const channel = subscribeToMessages(
        session?.user?.id || "",
        (messages) => { loadMessages(messages); },
      );
      return () => { channel.unsubscribe(); };
    }, [fetchUnreadCount, loadMessages, session?.user?.id]),
  );

  return (
    <View style={styles.appBar}>
      <View style={styles.appBarContent}>
        <View style={styles.brandContainer}>
          <Image source={logoImg} style={styles.logo} contentFit="contain" />
        </View>
        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.navigate("/messages")}
          >
            <MaterialIcons name="chat-bubble-outline" size={24} color={theme.text} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.navigate("/profile")}
          >
            <MaterialIcons name="person" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    appBar: {
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    appBarContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    brandContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      height: 32,
      width: 120,
    },
    appBarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    messageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    unreadBadge: {
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
    unreadBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
  });
}
