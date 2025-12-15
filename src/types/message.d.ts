export type Conversation = {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  last_message_at: string;
  created_at: string;
  // Extended fields from joins
  property?: {
    id: string;
    title: string;
    cover_image_url?: string;
  };
  landlord?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  last_message?: Message;
  unread_count?: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  attachment_url?: string;
  attachment_type?: "image" | "document" | "pdf";
  is_read: boolean;
  created_at: string;
  // Extended fields
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
};

export type CreateMessageData = {
  conversation_id: string;
  sender_id: string;
  content?: string;
  attachment_url?: string;
  attachment_type?: "image" | "document" | "pdf";
};
