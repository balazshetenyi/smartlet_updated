import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import { Conversation, Message } from "@/types/message";
import { pickImage } from "@/utils/image-picker-utils";
import {
  fetchConversationById,
  fetchConversationMessages,
  markMessagesAsRead,
  sendMessage,
  sendMessageWithAttachment,
  subscribeToMessages,
} from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  // Align param name with file `[conversation_id].tsx`
  const { conversation_id, propertyTitle } = useLocalSearchParams<{
    conversation_id: string;
    propertyTitle?: string;
  }>();
  const { profile } = useAuthStore();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  // Track message IDs to prevent duplicates when combining optimistic updates + realtime
  const messageIdsRef = useRef<Set<string>>(new Set());

  // Determine other participant
  const otherParticipant = conversation
    ? profile?.id === conversation.landlord_id
      ? conversation.tenant
      : conversation.landlord
    : null;

  useEffect(() => {
    if (!conversation_id) return;

    const initializeConversation = async () => {
      await loadConversation();
      await loadMessages();

      // Mark messages as read after loading
      if (profile?.id) {
        await markMessagesAsRead(conversation_id, profile.id);
      }
    };

    initializeConversation();

    // Subscribe to new messages
    const channel = subscribeToMessages(
      conversation_id,
      (newMessage: Message | Message[]) => {
        // Handle both single message and array of messages
        const messagesToAdd = Array.isArray(newMessage)
          ? newMessage
          : [newMessage];

        messagesToAdd.forEach((msg) => {
          // Dedupe in case optimistic insert already added it
          if (!messageIdsRef.current.has(msg.id)) {
            setMessages((prev) => [...prev, msg]);
            messageIdsRef.current.add(msg.id);
            setTimeout(() => scrollToBottom(), 50);

            // Mark new message as read immediately if we're viewing this conversation
            if (profile?.id && msg.sender_id !== profile.id) {
              markMessagesAsRead(conversation_id, profile.id);
            }
          }
        });
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [conversation_id, profile?.id]);

  const loadConversation = async () => {
    if (!conversation_id) return;

    try {
      const data = await fetchConversationById(conversation_id);
      setConversation(data);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const loadMessages = async () => {
    if (!conversation_id) return;

    try {
      const data = await fetchConversationMessages(conversation_id);
      setMessages(data);
      // Initialize ID set for dedupe
      messageIdsRef.current = new Set(data.map((m) => m.id));
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !profile?.id) return;

    setSending(true);
    try {
      const message = await sendMessage({
        conversation_id: conversation_id,
        sender_id: profile.id,
        content: inputText.trim(),
      });

      if (message) {
        // Optimistically append
        if (!messageIdsRef.current.has(message.id)) {
          setMessages((prev) => [...prev, message]);
          messageIdsRef.current.add(message.id);
        }
        setInputText("");
        setTimeout(() => scrollToBottom(), 50);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async () => {
    try {
      const image = await pickImage();
      if (!image || !profile?.id) return;

      setSending(true);
      const message = await sendMessageWithAttachment(
        conversation_id,
        profile.id,
        image,
        inputText.trim() || undefined
      );

      if (message) {
        if (!messageIdsRef.current.has(message.id)) {
          setMessages((prev) => [...prev, message]);
          messageIdsRef.current.add(message.id);
        }
        setInputText("");
        setTimeout(() => scrollToBottom(), 50);
      } else {
        Alert.alert("Error", "Failed to send attachment");
      }
    } catch (error) {
      console.error("Error sending attachment:", error);
      Alert.alert("Error", "Failed to send attachment");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === profile?.id;
    const showDate =
      index === 0 ||
      formatDate(messages[index - 1].created_at) !==
        formatDate(item.created_at);

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {item.attachment_url && (
            <Pressable
              onPress={() => {
                if (item.attachment_type === "image") {
                  // You can implement a full-screen image viewer here
                  Alert.alert("Image", "Image viewer coming soon");
                }
              }}
            >
              {item.attachment_type === "image" ? (
                <Image
                  source={{ uri: item.attachment_url }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.documentAttachment}>
                  <MaterialIcons
                    name="insert-drive-file"
                    size={24}
                    color={colours.primary}
                  />
                  <Text style={styles.documentText}>Document</Text>
                </View>
              )}
            </Pressable>
          )}

          {item.content && (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
          )}

          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerRow}>
                {otherParticipant?.avatar_url ? (
                  <Image
                    source={{ uri: otherParticipant.avatar_url }}
                    style={styles.headerAvatar}
                  />
                ) : (
                  <View style={styles.headerAvatarPlaceholder}>
                    <MaterialIcons
                      name="person"
                      size={20}
                      color={colours.muted}
                    />
                  </View>
                )}
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>
                    {propertyTitle || conversation?.property?.title || "Chat"}
                  </Text>
                  {otherParticipant && (
                    <Text style={styles.headerSubtitle}>
                      {otherParticipant.first_name} {otherParticipant.last_name}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={64}
                  color={colours.muted}
                />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleAttachment}
              disabled={sending}
            >
              <MaterialIcons
                name="attach-file"
                size={24}
                color={sending ? colours.muted : colours.primary}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colours.textSecondary}
              multiline
              maxLength={1000}
              editable={!sending}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="send" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colours.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colours.textSecondary,
    marginTop: 2,
  },
  // Header styles removed (using native stack header now)
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: colours.textSecondary,
    backgroundColor: colours.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    maxWidth: "75%",
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: colours.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: colours.surface,
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentAttachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    backgroundColor: colours.primaryLight,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentText: {
    fontSize: 14,
    color: colours.primary,
    fontWeight: "500",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: colours.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: colours.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    backgroundColor: colours.surface,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colours.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colours.text,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colours.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colours.muted,
    opacity: 0.5,
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
