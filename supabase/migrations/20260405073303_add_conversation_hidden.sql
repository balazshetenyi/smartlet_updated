-- NULL  = visible to both parties
-- <uuid> = hidden by that user; if the other party also hides it, the row is deleted
ALTER TABLE public.conversations
  ADD COLUMN hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT NULL;

-- Fix the existing DELETE policy: it only allows landlords (via property ownership).
-- Both participants must be able to delete a conversation.
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.conversations;

CREATE POLICY "Users can delete their conversations"
  ON public.conversations
  FOR DELETE TO authenticated
  USING (auth.uid() = landlord_id OR auth.uid() = tenant_id);

-- Trigger: when a new message arrives, unhide the conversation for both parties
CREATE OR REPLACE FUNCTION public.unhide_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET hidden_by = NULL
  WHERE id = NEW.conversation_id
    AND hidden_by IS NOT NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER unhide_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.unhide_conversation_on_message();
