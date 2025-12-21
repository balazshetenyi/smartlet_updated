import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import { Conversation } from "@/types/message";
import { fetchUserConversations } from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const { session } = useAuthStore();
  const router = useRouter();
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

      // Subscribe to message updates to refresh unread counts in real-time
      const channel = supabase
        .channel("messages-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
          },
          () => {
            // Small delay to ensure DB consistency
            setTimeout(() => loadConversations(), 100);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }, [session?.user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const getOtherUser = (conversation: Conversation) => {
    return session?.user?.id === conversation.landlord_id
      ? conversation.tenant
      : conversation.landlord;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    const hasUnread = (item.unread_count || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push(
            `/messages/${item.id}?propertyTitle=${
              item.property?.title || "Property"
            }` as any
          )
        }
      >
        <View style={styles.avatarContainer}>
          {otherUser?.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={28} color={colours.muted} />
            </View>
          )}
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadText]}>
              {otherUser?.first_name} {otherUser?.last_name}
            </Text>
            {item.last_message && (
              <Text style={styles.timestamp}>
                {formatTime(item.last_message.created_at)}
              </Text>
            )}
          </View>

          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.property?.title || "Property"}
          </Text>

          <View style={styles.lastMessageRow}>
            {item.last_message?.attachment_url && (
              <MaterialIcons
                name={
                  item.last_message.attachment_type === "image"
                    ? "image"
                    : "attach-file"
                }
                size={14}
                color={colours.textSecondary}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.last_message?.content ||
                (item.last_message?.attachment_url
                  ? `Sent ${item.last_message.attachment_type}`
                  : "No messages yet")}
            </Text>
          </View>
        </View>

        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="chat-bubble-outline"
        size={64}
        color={colours.muted}
      />
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>
        Start a conversation with a landlord or tenant
      </Text>
    </View>
  );

  if (loading) {
    return (
      // Remove top safe area to avoid double spacing (header already handles inset)
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    // Use only bottom edge to prevent extra gap under the stack header
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={
        conversations.length === 0 ? styles.emptyList : styles.listContent
      }
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colours.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    // paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colours.background,
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
    backgroundColor: colours.primary,
    borderWidth: 2,
    borderColor: colours.surface,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
  },
  unreadText: {
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: colours.textSecondary,
  },
  propertyTitle: {
    fontSize: 13,
    color: colours.primary,
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: colours.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colours.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colours.textSecondary,
    textAlign: "center",
  },
});
