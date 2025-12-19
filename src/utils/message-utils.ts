import { supabase } from "@/lib/supabase";
import { Conversation, CreateMessageData, Message } from "@/types/message";
import { uploadImageToStorage } from "@/utils/image-picker-utils";
import { sendPushNotification } from "@/utils/push-notifications-utils";
import * as ImagePicker from "expo-image-picker";

/**
 * Get or create a conversation between landlord and tenant for a property
 */
export const getOrCreateConversation = async (
  propertyId: string,
  landlordId: string,
  tenantId: string
): Promise<Conversation | null> => {
  try {
    // Try to find existing conversation
    const { data: existing, error: findError } = await supabase
      .from("conversations")
      .select("*")
      .eq("property_id", propertyId)
      .eq("landlord_id", landlordId)
      .eq("tenant_id", tenantId)
      .single();

    if (existing) {
      return existing as Conversation;
    }

    // Create new conversation if not found
    if (findError?.code === "PGRST116") {
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          property_id: propertyId,
          landlord_id: landlordId,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConversation as Conversation;
    }

    throw findError;
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    return null;
  }
};

/**
 * Fetch all conversations for the current user
 */
export const fetchUserConversations = async (
  userId: string
): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        property:properties!property_id (
          id,
          title,
          cover_image_url
        ),
        landlord:profiles!landlord_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        tenant:profiles!tenant_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .or(`landlord_id.eq.${userId},tenant_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    // Fetch last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv) => {
        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        return {
          ...conv,
          last_message: lastMsg,
          unread_count: count || 0,
        };
      })
    );

    return conversationsWithDetails as Conversation[];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
};

/**
 * Fetch a single conversation by ID with participants
 */
export const fetchConversationById = async (
  conversationId: string
): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        property:properties!property_id (
          id,
          title,
          cover_image_url
        ),
        landlord:profiles!landlord_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        tenant:profiles!tenant_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    return data as Conversation;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
};

/**
 * Get total unread messages count for a user across all conversations
 */
export const fetchTotalUnreadCount = async (
  userId: string
): Promise<number> => {
  try {
    // Get all conversations for the user
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`landlord_id.eq.${userId},tenant_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) return 0;

    // Count unread messages across all conversations
    const conversationIds = conversations.map((c) => c.id);
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    return count || 0;
  } catch (error) {
    console.error("Error fetching total unread count:", error);
    return 0;
  }
};

/**
 * Fetch messages for a conversation
 */
export const fetchConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles!sender_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []) as Message[];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

/**
 * Send push notification when a message is sent
 */
const sendMessageNotification = async (
  conversationId: string,
  senderId: string,
  messageContent?: string
): Promise<void> => {
  try {
    // Get conversation details to find recipient
    const { data: conversation } = await supabase
      .from("conversations")
      .select(
        `
        *,
        landlord:profiles!landlord_id (
          id,
          first_name,
          last_name,
          push_token
        ),
        tenant:profiles!tenant_id (
          id,
          first_name,
          last_name,
          push_token
        ),
        property:properties!property_id (
          title
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (!conversation) return;

    // Get sender details
    const { data: sender } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", senderId)
      .single();

    if (!sender) return;

    // Determine recipient (the person who is NOT the sender)
    const recipient =
      senderId === conversation.landlord_id
        ? conversation.tenant
        : conversation.landlord;

    // Only send notification if recipient has a push token
    if (!recipient?.push_token) {
      console.log("Recipient has no push token, skipping notification");
      return;
    }

    const senderName = `${sender.first_name} ${sender.last_name}`;
    const propertyTitle = conversation.property?.title || "Property";
    const notificationBody = messageContent || "Sent an attachment";

    await sendPushNotification(
      recipient.push_token,
      `${senderName} - ${propertyTitle}`,
      notificationBody
    );

    console.log(
      `Push notification sent to ${recipient.first_name} ${recipient.last_name}`
    );
  } catch (error) {
    console.error("Error sending message notification:", error);
  }
};

/**
 * Send a text message
 */
export const sendMessage = async (
  data: CreateMessageData
): Promise<Message | null> => {
  try {
    const { data: message, error } = await supabase
      .from("messages")
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversation_id);

    // Send push notification to recipient
    await sendMessageNotification(
      data.conversation_id,
      data.sender_id,
      data.content
    );

    return message as Message;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

/**
 * Upload attachment and send message
 */
export const sendMessageWithAttachment = async (
  conversationId: string,
  senderId: string,
  asset: ImagePicker.ImagePickerAsset,
  content?: string
): Promise<Message | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    // Determine attachment type
    const attachmentType = asset.type === "image" ? "image" : "document";

    // Upload to storage
    const bucket = "message-attachments";
    const publicUrl = await uploadImageToStorage(
      asset,
      bucket,
      session,
      conversationId
    );

    if (!publicUrl) throw new Error("Failed to upload attachment");

    // Send message with attachment
    return await sendMessage({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || "",
      attachment_url: publicUrl,
      attachment_type: attachmentType,
    });
  } catch (error) {
    console.error("Error sending message with attachment:", error);
    return null;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false);
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

/**
 * Subscribe to new messages in a conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch complete message with sender info
        const { data } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:profiles!sender_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `
          )
          .eq("id", payload.new.id);

        if (data) {
          callback(data as Message[]);
        }
      }
    )
    .subscribe();
};
