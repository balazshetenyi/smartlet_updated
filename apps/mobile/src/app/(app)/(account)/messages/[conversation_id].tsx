import { useAuthStore } from "@/store/auth-store";
import { colours, supabase } from "@kiado/shared";
import { Conversation, Message } from "@kiado/shared/types/message";
import { pickImage } from "@/utils/image-picker-utils";
import { ImageSourceType } from "@/enums/image-source-type";
import {
  fetchConversationById,
  fetchConversationMessages,
  getOrCreateConversation,
  markMessagesAsRead,
  sendMessage,
  sendMessageWithAttachment,
  subscribeToMessages,
} from "@/utils/message-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
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
import { Toast } from "react-native-toast-notifications";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ChatScreen() {
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

  const handleSendMessage = async () => {
    if (!inputText.trim() || !profile?.id) return;

    setSending(true);
    try {
      let convId = resolvedConversationId;

      // First message in a new conversation — create the conversation now
      if (!convId) {
        if (!propertyId || !landlordId || !tenantId) {
          Alert.alert("Error", "Missing conversation details");
          return;
        }
        const newConv = await getOrCreateConversation(
          propertyId,
          landlordId,
          tenantId,
        );
        if (!newConv) {
          Alert.alert("Error", "Failed to start conversation");
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
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Take Photo", "Choose from Library"],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) return;

        const sourceType =
          buttonIndex === 1 ? ImageSourceType.Camera : ImageSourceType.Library;

        try {
          const image = await pickImage(sourceType);
          if (!image || !profile?.id) return;

          setSending(true);
          let convId = resolvedConversationId;

          if (!convId) {
            if (!propertyId || !landlordId || !tenantId) {
              Alert.alert("Error", "Missing conversation details");
              return;
            }
            const newConv = await getOrCreateConversation(
              propertyId,
              landlordId,
              tenantId,
            );
            if (!newConv) {
              Alert.alert("Error", "Failed to start conversation");
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
            Alert.alert("Error", "Failed to send attachment");
          }
        } catch (error) {
          console.error("Error sending attachment:", error);
          Alert.alert("Error", "Failed to send attachment");
        } finally {
          setSending(false);
        }
      },
    );
  };

  const handleReport = async () => {
    Alert.alert(
      "Report Conversation",
      "Are you sure you want to report this conversation? Our team will review it within 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("reports").insert({
                reporter_id: profile?.id,
                conversation_id: resolvedConversationId,
                reason: "Reported by user via app",
              });
              if (error) throw error;
              Toast.show(
                "Report submitted. Thank you — our team will review it.",
                {
                  type: "success",
                  placement: "top",
                  duration: 4000,
                  animationType: "slide-in",
                },
              );
            } catch (e) {
              Alert.alert(
                "Error",
                "Failed to submit report. Please try again.",
              );
            }
          },
        },
      ],
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
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
                      color={colours.muted}
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
            <TouchableOpacity
              onPress={handleReport}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginRight: 8,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="flag" size={22} color={colours.muted} />
            </TouchableOpacity>
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
            name="image"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  flatList: {
    flex: 1,
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
    backgroundColor: colours.background,
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
    color: colours.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colours.textSecondary,
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
});
