import { useAuthStore } from "@/store/auth-store";
import { useMessageStore } from "@/store/message-store";
import { colours } from "@/styles/colours";
import { Message } from "@/types/message";
import {
  fetchTotalUnreadCount,
  subscribeToMessages,
} from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

export default function AppBar() {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();

      // Subscribe to message updates to refresh unread count in real-time
      const channel = subscribeToMessages(
        session?.user?.id || "",
        (messages: Message[]) => {
          loadMessages(messages);
        }
      );

      return () => {
        channel.unsubscribe();
      };
    }, [fetchUnreadCount, loadMessages, session?.user?.id])
  );

  return (
    <View style={styles.appBar}>
      <View style={styles.appBarContent}>
        {/* Logo/Brand */}
        <View style={styles.brandContainer}>
          <MaterialIcons name="home" size={28} color={colours.primary} />
          <Text style={styles.brandText}>SmartLet</Text>
        </View>

        {/* Search and Profile */}
        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setSearchFocused(true)}
          >
            <MaterialIcons name="search" size={24} color={colours.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.navigate("/profile")}
          >
            <MaterialIcons name="person" size={24} color={colours.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.navigate("/messages")}
          >
            <MaterialIcons
              name="chat-bubble-outline"
              size={24}
              color={colours.text}
            />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Bar */}
      {searchFocused && (
        <View style={styles.expandedSearchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={colours.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties, cities..."
            placeholderTextColor={colours.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            onBlur={() => {
              if (!searchQuery) setSearchFocused(false);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color={colours.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSearchQuery("");
              setSearchFocused(false);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  appBar: {
    backgroundColor: colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
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
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
  },
  appBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.background,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colours.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colours.surface,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  expandedSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colours.text,
    backgroundColor: colours.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
});
