import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@kiado/shared";
import { Conversation, Message } from "@kiado/shared/types/message";
import { pickImage } from "@/utils/image-picker-utils";
import { ImageSourceType } from "@/enums/image-source-type";
import {
  fetchConversationById,
  fetchConversationMessages,
  getOrCreateConversation,
  hideConversation,
  markMessagesAsRead,
  sendMessage,
  sendMessageWithAttachment,
  subscribeToMessages,
} from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { showToastMessage } from "@/components/shared/ToastMessage";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ChatScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { conversation_id, propertyTitle, propertyId, landlordId, tenantId } =
    useLocalSearchParams<{
      conversation_id: string;
      propertyTitle?: string;
      // Passed when opening a brand-new (not-yet-created) conversation
      propertyId?: string;
      landlordId?: string;
      tenantId?: string;
    }>();

  const isNew = conversation_id === "new";

  const { profile } = useAuthStore();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [resolvedConversationId, setResolvedConversationId] = useState<
    string | null
  >(isNew ? null : conversation_id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  );
  const [isSuggestingReplies, setIsSuggestingReplies] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const headerHeight = useHeaderHeight();
  const { width: screenWidth } = useWindowDimensions();
  const titleMaxWidth = screenWidth - 140;
  const subscriptionRef = useRef<ReturnType<typeof subscribeToMessages> | null>(
    null,
  );

  const otherParticipant = conversation
    ? profile?.id === conversation.landlord_id
      ? conversation.tenant
      : conversation.landlord
    : null;

  // Subscribe to realtime once we have a real conversation ID
  const subscribeToConversation = (convId: string) => {
    if (subscriptionRef.current) return; // already subscribed
    subscriptionRef.current = subscribeToMessages(
      convId,
      (newMessage: Message | Message[]) => {
        const messagesToAdd = Array.isArray(newMessage)
          ? newMessage
          : [newMessage];
        messagesToAdd.forEach((msg) => {
          if (!messageIdsRef.current.has(msg.id)) {
            setMessages((prev) => [msg, ...prev]);
            messageIdsRef.current.add(msg.id);
            if (profile?.id && msg.sender_id !== profile.id) {
              markMessagesAsRead(convId, profile.id);
            }
          }
        });
      },
    );
  };

  useEffect(() => {
    if (isNew) return; // nothing to load for a new conversation

    const initializeConversation = async () => {
      await loadConversation(conversation_id);
      await loadMessages(conversation_id);
      if (profile?.id) {
        await markMessagesAsRead(conversation_id, profile.id);
      }
    };

    initializeConversation();
    subscribeToConversation(conversation_id);

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [conversation_id, profile?.id]);

  const loadConversation = async (convId: string) => {
    try {
      const data = await fetchConversationById(convId);
      setConversation(data);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await fetchConversationMessages(convId);
      setMessages(data);
      messageIdsRef.current = new Set(data.map((m) => m.id));
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (isSuggestingReplies || messages.length === 0) return;
    setIsSuggestingReplies(true);
    setSuggestions([]);
    try {
      const recentMessages = [...messages]
        .slice(0, 10)
        .reverse()
        .filter((m) => m.content?.trim())
        .map((m) => ({ content: m.content, isOwn: m.sender_id === profile?.id }));

      const myRole =
        conversation && profile?.id === conversation.landlord_id
          ? "landlord"
          : "tenant";

      const { data, error } = await supabase.functions.invoke("suggest-reply", {
        body: {
          messages: recentMessages,
          myRole,
          propertyTitle: propertyTitle || conversation?.property?.title,
        },
      });

      if (error) throw error;
      if (Array.isArray(data?.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch {
      showToastMessage({ message: "Couldn't generate suggestions", type: "danger" });
    } finally {
      setIsSuggestingReplies(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !profile?.id) return;

    setSending(true);
    try {
      let convId = resolvedConversationId;

      // First message in a new conversation — create the conversation now
      if (!convId) {
        if (!propertyId || !landlordId || !tenantId) {
          showToastMessage({
            message: "Missing conversation details",
            type: "danger",
          });
          return;
        }
        const newConv = await getOrCreateConversation(
          propertyId,
          landlordId,
          tenantId,
        );
        if (!newConv) {
          showToastMessage({
            message: "Failed to start conversation",
            type: "danger",
          });
          return;
        }
        convId = newConv.id;
        setResolvedConversationId(convId);
        setConversation(newConv);
        // Replace the "new" route with the real conversation ID so back-navigation works
        router.replace(
          `/messages/${convId}?propertyTitle=${encodeURIComponent(propertyTitle ?? "")}` as any,
        );
        subscribeToConversation(convId);
      }

      const message = await sendMessage({
        conversation_id: convId,
        sender_id: profile.id,
        content: inputText.trim(),
      });

      if (message) {
        if (!messageIdsRef.current.has(message.id)) {
          setMessages((prev) => [message, ...prev]);
          messageIdsRef.current.add(message.id);
        }
        setInputText("");
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error sending message.");
      showToastMessage({
        message: "Failed to send message",
        type: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    showActionSheetWithOptions(
      {
        title: "Add Attachment",
        options: ["Cancel", "Take Photo", "Choose from Library"],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0 || buttonIndex == null) return;

        const sourceType =
          buttonIndex === 1 ? ImageSourceType.Camera : ImageSourceType.Library;

        try {
          const image = await pickImage(sourceType);
          if (!image || !profile?.id) return;

          setSending(true);
          let convId = resolvedConversationId;

          if (!convId) {
            if (!propertyId || !landlordId || !tenantId) {
              showToastMessage({
                message: "Missing conversation details",
                type: "danger",
              });
              return;
            }
            const newConv = await getOrCreateConversation(
              propertyId,
              landlordId,
              tenantId,
            );
            if (!newConv) {
              showToastMessage({
                message: "Failed to start conversation",
                type: "danger",
              });
              return;
            }
            convId = newConv.id;
            setResolvedConversationId(convId);
            setConversation(newConv);
            router.replace(
              `/messages/${convId}?propertyTitle=${encodeURIComponent(propertyTitle ?? "")}` as any,
            );
            subscribeToConversation(convId);
          }

          const message = await sendMessageWithAttachment(
            convId,
            profile.id,
            image,
            inputText.trim() || undefined,
          );

          if (message) {
            if (!messageIdsRef.current.has(message.id)) {
              setMessages((prev) => [message, ...prev]);
              messageIdsRef.current.add(message.id);
            }
            setInputText("");
          } else {
            showToastMessage({
              message: "Failed to send attachment",
              type: "danger",
            });
          }
        } catch (error) {
          console.error("Error sending attachment.");
          showToastMessage({
            message: "Failed to send attachment",
            type: "danger",
          });
        } finally {
          setSending(false);
        }
      },
    );
  };

  const handleReport = async () => {
    showActionSheetWithOptions(
      {
        title: "Report Conversation",
        message:
          "Are you sure you want to report this conversation? Our team will review it within 24 hours.",
        options: ["Cancel", "Report"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (buttonIndex !== 1) return;

        try {
          const { error } = await supabase.from("reports").insert({
            reporter_id: profile?.id,
            conversation_id: resolvedConversationId,
            reason: "Reported by user via app",
          });
          if (error) throw error;
          showToastMessage({
            message: "Report submitted. Thank you — our team will review it.",
            type: "success",
          });
        } catch (e) {
          showToastMessage({
            message: "Failed to submit report. Please try again.",
            type: "danger",
          });
        }
      },
    );
  };

  const handleHideConversation = () => {
    if (!resolvedConversationId || !profile) return;

    const doHide = async () => {
      try {
        await hideConversation(resolvedConversationId, profile.id);
        router.back();
      } catch (e) {
        showToastMessage({
          message: "Could not delete conversation. Please try again.",
          type: "danger",
        });
      }
    };

    showActionSheetWithOptions(
      {
        title: "Delete Conversation",
        message:
          "This conversation will be hidden from your inbox. It will reappear if either party sends a new message.",
        options: ["Cancel", "Delete Conversation"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          void doHide();
        }
      },
    );
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
      index === messages.length - 1 ||
      formatDate(messages[index + 1].created_at) !==
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
                  setSelectedImage(item.attachment_url);
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
                    color={theme.primary}
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight + 60}
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View
              style={[styles.headerTitleContainer, { width: titleMaxWidth }]}
            >
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
                      color={theme.muted}
                    />
                  </View>
                )}
                <View style={styles.headerTextContainer}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.headerTitle}
                  >
                    {propertyTitle || conversation?.property?.title || "Chat"}
                  </Text>
                  {otherParticipant && (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.headerSubtitle}
                    >
                      {otherParticipant.first_name} {otherParticipant.last_name}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ),
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <TouchableOpacity
                onPress={handleReport}
                style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="flag" size={22} color={theme.warning} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleHideConversation}
                style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={22}
                  color={theme.danger}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        // ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
        contentContainerStyle={styles.messagesList}
        inverted
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={64}
              color={theme.muted}
            />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsRow}
          contentContainerStyle={styles.suggestionsContent}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.suggestionChip,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                setInputText(suggestion);
                setSuggestions([]);
              }}
            >
              <View style={styles.suggestionInner}>
              <Text style={styles.suggestionLabel}>Suggestion {index + 1}</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}
          disabled={sending}
        >
          <MaterialIcons
            name="image"
            size={24}
            color={sending ? theme.muted : theme.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.suggestButton}
          onPress={fetchSuggestions}
          disabled={isSuggestingReplies || messages.length === 0 || sending}
        >
          {isSuggestingReplies ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <MaterialIcons
              name="auto-awesome"
              size={22}
              color={
                messages.length === 0 || sending ? theme.muted : theme.primary
              }
            />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={theme.textSecondary}
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
        <Modal
          visible={!!selectedImage}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImage(undefined)}
          statusBarTranslucent
        >
          <StatusBar hidden />
          <View style={styles.imageViewerOverlay}>
            <Pressable
              style={styles.imageViewerClose}
              onPress={() => setSelectedImage(undefined)}
            >
              <MaterialIcons name="close" size={28} color="#fff" />
            </Pressable>
            <ScrollView
              contentContainerStyle={styles.imageViewerScrollContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent
            >
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                />
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    flatList: {
      flex: 1,
      backgroundColor: t.background,
    },
    headerTitleContainer: {},
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
      backgroundColor: t.background,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextContainer: {
      flex: 1,
      overflow: "hidden",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: t.textSecondary,
      marginTop: 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    messagesList: {
      padding: 16,
      // flexGrow: 1,
    },
    dateSeparator: {
      alignItems: "center",
      marginVertical: 16,
    },
    dateText: {
      fontSize: 12,
      color: t.textSecondary,
      backgroundColor: t.surface,
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
      backgroundColor: t.primary,
      borderBottomRightRadius: 4,
    },
    otherMessage: {
      alignSelf: "flex-start",
      backgroundColor: t.surface,
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
      backgroundColor: t.primaryLight,
      borderRadius: 8,
      marginBottom: 4,
    },
    documentText: {
      fontSize: 14,
      color: t.primary,
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
      color: t.text,
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
      color: t.textSecondary,
    },
    inputContainer: {
      flexDirection: "row",
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.surface,
    },
    attachButton: {
      padding: 8,
      marginRight: 8,
    },
    input: {
      flex: 1,
      backgroundColor: t.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: t.text,
      marginRight: 8,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      backgroundColor: t.muted,
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
      color: t.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: "center",
    },
    imageViewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    imageViewerClose: {
      position: "absolute",
      top: 52,
      right: 20,
      zIndex: 10,
      padding: 8,
    },
    imageViewerScrollContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    imageViewerImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
    },
    suggestionsRow: {
      backgroundColor: t.surface,
      borderTopWidth: 1,
      borderTopColor: t.border,
      maxHeight: 120,
    },
    suggestionsContent: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    suggestionChip: {
      backgroundColor: t.primaryLight,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: t.primary + "33",
    },
    suggestionInner: {
      width: 192,
    },
    suggestionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: t.primary,
      opacity: 0.6,
      marginBottom: 3,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    suggestionText: {
      fontSize: 13,
      color: t.primary,
      lineHeight: 18,
    },
    suggestButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 4,
    },
  });
}
