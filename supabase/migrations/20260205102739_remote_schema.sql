

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'tenant',
    'landlord'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'vacant',
    'occupied',
    'under_offer'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."maintenance_status" AS ENUM (
    'open',
    'in_progress',
    'resolved'
);


ALTER TYPE "public"."maintenance_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'declined'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."priority" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.raw_user_meta_data->>'avatar_url' is null or new.raw_user_meta_data->>'avatar_url' = '' then
    new.raw_user_meta_data = jsonb_set(new.raw_user_meta_data, '{avatar_url}', '"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"' :: jsonb);
  end if;
  insert into public.profiles (id, first_name, last_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.email, new.raw_user_meta_data->>'avatar_url');

  insert into public.user_roles (user_id, role)
  values (new.id, (new.raw_user_meta_data->>'user_role')::app_role);

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_booking_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  property_title TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF OLD.status != NEW.status THEN
    -- Get property title
    SELECT title INTO property_title
    FROM properties
    WHERE id = NEW.property_id;
    
    -- Set notification based on status
    IF NEW.status = 'confirmed' THEN
      notification_title := 'Booking Confirmed';
      notification_message := 'Your booking for ' || property_title || ' has been confirmed!';
    ELSIF NEW.status = 'cancelled' THEN
      notification_title := 'Booking Cancelled';
      notification_message := 'Your booking for ' || property_title || ' has been cancelled.';
    ELSIF NEW.status = 'declined' THEN
      notification_title := 'Booking Declined';
      notification_message := 'Your booking for ' || property_title || ' has been declined.';
    END IF;
    
    -- Create notification for tenant
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.tenant_id,
      notification_title,
      notification_message,
      'booking_' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_booking_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_landlord_of_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  prop_landlord_id UUID;
  property_title TEXT;
  tenant_name TEXT;
BEGIN
  -- Get landlord_id and property title
  SELECT p.landlord_id, p.title INTO prop_landlord_id, property_title
  FROM properties p
  WHERE p.id = NEW.property_id;
  
  -- Get tenant name
  SELECT first_name || ' ' || last_name INTO tenant_name
  FROM profiles
  WHERE id = NEW.tenant_id;
  
  -- Create notification for landlord
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (
    prop_landlord_id,
    'New Booking Request',
    tenant_name || ' has requested to book ' || property_title,
    'booking_request',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_landlord_of_booking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."amenities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text"
);


ALTER TABLE "public"."amenities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid",
    "document_type" "text",
    "file_url" "text" NOT NULL,
    "file_name" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "application_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['id'::"text", 'proof_of_income'::"text", 'bank_statement'::"text", 'employment_letter'::"text", 'reference_letter'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."application_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid",
    "old_status" "text",
    "new_status" "text",
    "changed_by" "uuid",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."application_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "check_in" "date" NOT NULL,
    "check_out" "date" NOT NULL,
    "total_price" numeric(10,2),
    "status" "text" DEFAULT '''draft''::text'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "base_price" numeric,
    "service_fee" numeric,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_due_at" timestamp without time zone,
    "paid_at" timestamp without time zone,
    "payment_method_id" "text",
    "refund_amount" numeric,
    "refunded_at" timestamp without time zone,
    "reminder_sent_at" timestamp without time zone,
    "declined_at" timestamp without time zone,
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'declined'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "landlord_id" "uuid",
    "tenant_id" "uuid",
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "attachment_url" "text",
    "attachment_type" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" NOT NULL,
    "related_id" "uuid",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['booking_request'::"text", 'booking_confirmed'::"text", 'booking_cancelled'::"text", 'booking_declined'::"text", 'payment'::"text", 'message'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'GBP'::"text",
    "payment_method" "text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    CONSTRAINT "payments_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_name" "text" NOT NULL,
    "avatar_url" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "push_token" "text",
    "stripe_account_id" "text",
    "stripe_customer_id" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landlord_id" "uuid" DEFAULT "auth"."uid"(),
    "title" "text" NOT NULL,
    "description" "text",
    "address" "text",
    "city" "text",
    "postcode" "text",
    "price" numeric(10,2),
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "location" "extensions"."geography"(Point,4326),
    "bedrooms" integer,
    "bathrooms" integer,
    "cover_image_url" "text",
    "rental_type" "text" DEFAULT 'long_term'::"text",
    CONSTRAINT "properties_rental_type_check" CHECK (("rental_type" = ANY (ARRAY['long_term'::"text", 'short_term'::"text", 'holiday'::"text"])))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


COMMENT ON COLUMN "public"."properties"."price" IS 'Price based on rental_type: monthly for long_term, weekly for short_term, nightly for holiday';



COMMENT ON COLUMN "public"."properties"."rental_type" IS 'Type of rental: long_term (monthly), short_term (weekly), or holiday (nightly)';



CREATE TABLE IF NOT EXISTS "public"."property_amenities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid",
    "amenity_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_amenities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid",
    "image_url" "text" NOT NULL,
    "is_featured" boolean DEFAULT false,
    "is_cover" boolean DEFAULT false
);


ALTER TABLE "public"."property_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_unavailable_dates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_date_range" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."property_unavailable_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rental_applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "employment_status" "text",
    "employer_name" "text",
    "monthly_income" numeric,
    "occupation" "text",
    "current_address" "text",
    "landlord_reference_name" "text",
    "landlord_reference_contact" "text",
    "years_at_current_address" integer,
    "reason_for_moving" "text",
    "reference_1_name" "text",
    "reference_1_contact" "text",
    "reference_1_relationship" "text",
    "reference_2_name" "text",
    "reference_2_contact" "text",
    "reference_2_relationship" "text",
    "pets" boolean DEFAULT false,
    "pet_details" "text",
    "smoker" boolean DEFAULT false,
    "number_of_occupants" integer,
    "move_in_date" "date",
    "lease_duration_months" integer,
    "cover_letter" "text",
    "additional_notes" "text",
    "landlord_notes" "text",
    "rejection_reason" "text",
    "info_requested" "text",
    "submitted_at" timestamp without time zone DEFAULT "now"(),
    "reviewed_at" timestamp without time zone,
    "approved_at" timestamp without time zone,
    "rejected_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "rental_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'under_review'::"text", 'info_requested'::"text", 'approved'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."rental_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'Application roles for each user.';



ALTER TABLE "public"."user_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."amenities"
    ADD CONSTRAINT "amenities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_documents"
    ADD CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_status_history"
    ADD CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_property_id_landlord_id_tenant_id_key" UNIQUE ("property_id", "landlord_id", "tenant_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_property_id_amenity_id_key" UNIQUE ("property_id", "amenity_id");



ALTER TABLE ONLY "public"."property_photos"
    ADD CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_unavailable_dates"
    ADD CONSTRAINT "property_unavailable_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rental_applications"
    ADD CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE INDEX "idx_bookings_dates" ON "public"."bookings" USING "btree" ("check_in", "check_out");



CREATE INDEX "idx_bookings_property" ON "public"."bookings" USING "btree" ("property_id");



CREATE INDEX "idx_bookings_tenant" ON "public"."bookings" USING "btree" ("tenant_id");



CREATE INDEX "idx_conversations_landlord" ON "public"."conversations" USING "btree" ("landlord_id");



CREATE INDEX "idx_conversations_property" ON "public"."conversations" USING "btree" ("property_id");



CREATE INDEX "idx_conversations_tenant" ON "public"."conversations" USING "btree" ("tenant_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_created" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_property_photos_cover" ON "public"."property_photos" USING "btree" ("property_id", "is_cover");



CREATE INDEX "idx_property_unavailable_dates_dates" ON "public"."property_unavailable_dates" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_property_unavailable_dates_property" ON "public"."property_unavailable_dates" USING "btree" ("property_id");



CREATE INDEX "properties_location_idx" ON "public"."properties" USING "gist" ("location");



CREATE OR REPLACE TRIGGER "booking_created_notify" AFTER INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."notify_landlord_of_booking"();



CREATE OR REPLACE TRIGGER "booking_status_changed_notify" AFTER UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."notify_booking_status_change"();



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."application_documents"
    ADD CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."rental_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_documents"
    ADD CONSTRAINT "application_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."application_status_history"
    ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."rental_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application_status_history"
    ADD CONSTRAINT "application_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_amenities"
    ADD CONSTRAINT "property_amenities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_photos"
    ADD CONSTRAINT "property_photos_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_unavailable_dates"
    ADD CONSTRAINT "property_unavailable_dates_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_applications"
    ADD CONSTRAINT "rental_applications_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rental_applications"
    ADD CONSTRAINT "rental_applications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_applications"
    ADD CONSTRAINT "rental_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Anyone can read unavailable dates" ON "public"."property_unavailable_dates" FOR SELECT USING (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."conversations" FOR DELETE TO "authenticated" USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."properties" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "landlord_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."property_photos" FOR DELETE USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."property_unavailable_dates" FOR DELETE USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "landlord_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."property_photos" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."properties" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."property_photos" FOR SELECT USING (true);



CREATE POLICY "Enable update for users based on email" ON "public"."properties" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "landlord_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "landlord_id"));



CREATE POLICY "Landlords can manage unavailable dates for their properties" ON "public"."property_unavailable_dates" USING ((EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "property_unavailable_dates"."property_id") AND ("properties"."landlord_id" = "auth"."uid"())))));



CREATE POLICY "Participants can delete messages in their conversations" ON "public"."messages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."landlord_id" = "auth"."uid"()) OR ("conversations"."tenant_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "landlord_id") OR ("auth"."uid"() = "tenant_id")));



CREATE POLICY "Users can mark received messages as read" ON "public"."messages" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."landlord_id" = "auth"."uid"()) OR ("conversations"."tenant_id" = "auth"."uid"()))))) AND ("sender_id" <> "auth"."uid"()))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."landlord_id" = "auth"."uid"()) OR ("conversations"."tenant_id" = "auth"."uid"()))))) AND ("sender_id" <> "auth"."uid"())));



CREATE POLICY "Users can send messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."landlord_id" = "auth"."uid"()) OR ("conversations"."tenant_id" = "auth"."uid"())))))));



CREATE POLICY "Users can update their conversations" ON "public"."conversations" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "landlord_id") OR ("auth"."uid"() = "tenant_id")));



CREATE POLICY "Users can update their own messages" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update their property photos" ON "public"."property_photos" FOR UPDATE USING (("property_id" IN ( SELECT "properties"."id"
   FROM "public"."properties"
  WHERE ("properties"."landlord_id" = "auth"."uid"()))));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."landlord_id" = "auth"."uid"()) OR ("conversations"."tenant_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "landlord_id") OR ("auth"."uid"() = "tenant_id")));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_unavailable_dates" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";







































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."handle_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_booking_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_booking_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_booking_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_landlord_of_booking"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_landlord_of_booking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_landlord_of_booking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";
































































































GRANT ALL ON TABLE "public"."amenities" TO "anon";
GRANT ALL ON TABLE "public"."amenities" TO "authenticated";
GRANT ALL ON TABLE "public"."amenities" TO "service_role";



GRANT ALL ON TABLE "public"."application_documents" TO "anon";
GRANT ALL ON TABLE "public"."application_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."application_documents" TO "service_role";



GRANT ALL ON TABLE "public"."application_status_history" TO "anon";
GRANT ALL ON TABLE "public"."application_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."application_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_amenities" TO "anon";
GRANT ALL ON TABLE "public"."property_amenities" TO "authenticated";
GRANT ALL ON TABLE "public"."property_amenities" TO "service_role";



GRANT ALL ON TABLE "public"."property_photos" TO "anon";
GRANT ALL ON TABLE "public"."property_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."property_photos" TO "service_role";



GRANT ALL ON TABLE "public"."property_unavailable_dates" TO "anon";
GRANT ALL ON TABLE "public"."property_unavailable_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."property_unavailable_dates" TO "service_role";



GRANT ALL ON TABLE "public"."rental_applications" TO "anon";
GRANT ALL ON TABLE "public"."rental_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."rental_applications" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
