import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@kiado/shared";
import { Conversation } from "@kiado/shared/types/message";
import {
  fetchUserConversations,
  hideConversation,
} from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useActionSheet } from "@expo/react-native-action-sheet";
import { showToastMessage } from "@/components/shared/ToastMessage";

export default function ConversationList() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuthStore();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    if (!session?.user?.id) return;
    try {
      const data = await fetchUserConversations(session.user.id);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();

      const channel = supabase
        .channel("conversation-list-updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages" },
          () => { setTimeout(() => loadConversations(), 100); },
        )
        .subscribe();

      return () => { channel.unsubscribe(); };
    }, [session?.user?.id]),
  );

  const getOtherUser = (c: Conversation) =>
    session?.user?.id === c.landlord_id ? c.tenant : c.landlord;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleHide = (conversation: Conversation) => {
    showActionSheetWithOptions(
      {
        title: "Delete Conversation",
        message:
          "This conversation will be hidden. It will reappear if either party sends a new message.",
        options: ["Cancel", "Delete Conversation"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex !== 1) return;
        void (async () => {
          try {
            await hideConversation(conversation.id, session!.user.id);
            setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
          } catch {
            showToastMessage({ message: "Could not delete conversation.", type: "danger" });
          }
        })();
      },
    );
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    const hasUnread = (item.unread_count || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          router.push(
            `/messages/${item.id}?propertyTitle=${item.property?.title || "Property"}` as any,
          )
        }
        onLongPress={() => handleHide(item)}
        delayLongPress={400}
      >
        <View style={styles.avatarWrap}>
          {otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={28} color={theme.textMuted} />
            </View>
          )}
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.userName, hasUnread && styles.bold]}>
              {otherUser?.first_name} {otherUser?.last_name}
            </Text>
            {item.last_message && (
              <Text style={styles.timestamp}>{formatTime(item.last_message.created_at)}</Text>
            )}
          </View>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.property?.title || "Property"}
          </Text>
          <View style={styles.lastRow}>
            {item.last_message?.attachment_url && (
              <MaterialIcons
                name={item.last_message.attachment_type === "image" ? "image" : "attach-file"}
                size={14}
                color={theme.textMuted}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[styles.lastMessage, hasUnread && styles.bold]} numberOfLines={1}>
              {item.last_message?.content ||
                (item.last_message?.attachment_url
                  ? `Sent ${item.last_message.attachment_type}`
                  : "No messages yet")}
            </Text>
          </View>
        </View>

        {hasUnread && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
      ListEmptyComponent={
        <View style={styles.centered}>
          <MaterialIcons name="chat-bubble-outline" size={56} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            Conversations with guests will appear here
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadConversations(); }}
          tintColor={theme.primary}
        />
      }
    />
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    list: {
      flex: 1,
      backgroundColor: t.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyList: {
      flexGrow: 1,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    avatarWrap: {
      position: "relative",
      marginRight: 14,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    avatarPlaceholder: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.background,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadDot: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: t.primary,
      borderWidth: 2,
      borderColor: t.surface,
    },
    content: {
      flex: 1,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    userName: {
      fontSize: 15,
      fontWeight: "600",
      color: t.text,
    },
    bold: {
      fontWeight: "700",
    },
    timestamp: {
      fontSize: 11,
      color: t.textMuted,
    },
    propertyTitle: {
      fontSize: 12,
      color: t.primary,
      marginBottom: 3,
    },
    lastRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    lastMessage: {
      fontSize: 13,
      color: t.textSecondary,
      flex: 1,
    },
    badge: {
      backgroundColor: t.primary,
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      marginLeft: 8,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
  });
}
