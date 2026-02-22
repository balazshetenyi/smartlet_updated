-- Enable Row Level Security
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own profile"
ON "public"."profiles"
FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Notifications: Users can only view and manage their own notifications
CREATE POLICY "Users can view and manage their own notifications"
ON "public"."notifications"
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());