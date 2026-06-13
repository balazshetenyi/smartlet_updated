-- Service Marketplace: adds service_operator role, new tables, and extends conversations

-- ============================================================
-- 1. Extend app_role enum
-- ============================================================
ALTER TYPE "public"."app_role" ADD VALUE IF NOT EXISTS 'service_operator';


-- ============================================================
-- 2. Service operator extended profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."service_operator_profiles" (
    "id" "uuid" NOT NULL,
    "bio" "text",
    "services" "text"[] DEFAULT '{}' NOT NULL,
    "area_lat" double precision,
    "area_lng" double precision,
    "area_radius_km" integer DEFAULT 10 NOT NULL,
    "city" "text",
    "postcode" "text",
    "is_available" boolean DEFAULT true NOT NULL,
    "stripe_account_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_operator_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_operator_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."service_operator_profiles" OWNER TO "postgres";


-- ============================================================
-- 3. Service jobs posted by landlords
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."service_jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "landlord_id" "uuid" NOT NULL,
    "service_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "scheduled_date" "date",
    "status" "text" DEFAULT 'open' NOT NULL,
    "source" "text" DEFAULT 'manual' NOT NULL,
    "assigned_operator_id" "uuid",
    "final_price" numeric(10,2),
    "payment_intent_id" "text",
    "payment_status" "text" DEFAULT 'pending' NOT NULL,
    "platform_fee" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_jobs_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'assigned'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "service_jobs_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'held'::"text", 'released'::"text", 'refunded'::"text"]))),
    CONSTRAINT "service_jobs_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'auto_checkout'::"text"]))),
    CONSTRAINT "service_jobs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE,
    CONSTRAINT "service_jobs_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "service_jobs_assigned_operator_id_fkey" FOREIGN KEY ("assigned_operator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL
);

ALTER TABLE "public"."service_jobs" OWNER TO "postgres";

CREATE INDEX "idx_service_jobs_landlord" ON "public"."service_jobs" USING "btree" ("landlord_id");
CREATE INDEX "idx_service_jobs_property" ON "public"."service_jobs" USING "btree" ("property_id");
CREATE INDEX "idx_service_jobs_status" ON "public"."service_jobs" USING "btree" ("status");
CREATE INDEX "idx_service_jobs_scheduled_date" ON "public"."service_jobs" USING "btree" ("scheduled_date");


-- ============================================================
-- 4. Service job applications from operators
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."service_job_applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "operator_id" "uuid" NOT NULL,
    "quote_price" numeric(10,2) NOT NULL,
    "cover_note" "text",
    "status" "text" DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_job_applications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_job_applications_unique" UNIQUE ("job_id", "operator_id"),
    CONSTRAINT "service_job_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'declined'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "service_job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."service_jobs"("id") ON DELETE CASCADE,
    CONSTRAINT "service_job_applications_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."service_job_applications" OWNER TO "postgres";

CREATE INDEX "idx_service_job_applications_job" ON "public"."service_job_applications" USING "btree" ("job_id");
CREATE INDEX "idx_service_job_applications_operator" ON "public"."service_job_applications" USING "btree" ("operator_id");


-- ============================================================
-- 5. Extend conversations for service jobs
-- ============================================================
ALTER TABLE "public"."conversations"
    ADD COLUMN IF NOT EXISTS "service_job_id" "uuid" REFERENCES "public"."service_jobs"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "service_operator_id" "uuid" REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

CREATE INDEX "idx_conversations_service_job" ON "public"."conversations" USING "btree" ("service_job_id");
CREATE INDEX "idx_conversations_service_operator" ON "public"."conversations" USING "btree" ("service_operator_id");


-- ============================================================
-- 6. Drop the hard-coded notifications type CHECK constraint
--    and replace with a broader one that includes service types.
--    (The constraint name from the original migration is notifications_type_check)
-- ============================================================
ALTER TABLE "public"."notifications"
    DROP CONSTRAINT IF EXISTS "notifications_type_check";

ALTER TABLE "public"."notifications"
    ADD CONSTRAINT "notifications_type_check" CHECK (
        "type" = ANY (ARRAY[
            'booking_request'::"text",
            'booking_confirmed'::"text",
            'booking_cancelled'::"text",
            'booking_declined'::"text",
            'payment'::"text",
            'message'::"text",
            'system'::"text",
            'service_job_posted'::"text",
            'service_application_received'::"text",
            'service_application_approved'::"text",
            'service_application_declined'::"text",
            'service_job_completed'::"text"
        ])
    );


-- ============================================================
-- 7. updated_at trigger for service_jobs
-- ============================================================
CREATE OR REPLACE FUNCTION "public"."set_service_jobs_updated_at"()
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "service_jobs_updated_at"
    BEFORE UPDATE ON "public"."service_jobs"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_service_jobs_updated_at"();


-- ============================================================
-- 8. RLS
-- ============================================================
ALTER TABLE "public"."service_operator_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_job_applications" ENABLE ROW LEVEL SECURITY;

-- service_operator_profiles
CREATE POLICY "Operators manage own profile"
    ON "public"."service_operator_profiles"
    FOR ALL
    TO "authenticated"
    USING (("id" = "auth"."uid"()))
    WITH CHECK (("id" = "auth"."uid"()));

CREATE POLICY "Anyone can read operator profiles"
    ON "public"."service_operator_profiles"
    FOR SELECT
    TO "authenticated"
    USING (true);

-- service_jobs
CREATE POLICY "Landlords manage own jobs"
    ON "public"."service_jobs"
    FOR ALL
    TO "authenticated"
    USING (("landlord_id" = "auth"."uid"()))
    WITH CHECK (("landlord_id" = "auth"."uid"()));

CREATE POLICY "Operators read open jobs"
    ON "public"."service_jobs"
    FOR SELECT
    TO "authenticated"
    USING (
        ("status" = 'open') OR
        ("assigned_operator_id" = "auth"."uid"()) OR
        ("landlord_id" = "auth"."uid"())
    );

-- service_job_applications
CREATE POLICY "Operators manage own applications"
    ON "public"."service_job_applications"
    FOR ALL
    TO "authenticated"
    USING (("operator_id" = "auth"."uid"()))
    WITH CHECK (("operator_id" = "auth"."uid"()));

CREATE POLICY "Landlords read applications for their jobs"
    ON "public"."service_job_applications"
    FOR SELECT
    TO "authenticated"
    USING (
        EXISTS (
            SELECT 1 FROM "public"."service_jobs" sj
            WHERE sj.id = "job_id"
            AND sj.landlord_id = "auth"."uid"()
        )
    );

-- Extend conversations RLS: service_operator_id counts as a participant
-- (existing policies use landlord_id/tenant_id; we add a separate policy)
CREATE POLICY "Service operators can view their job conversations"
    ON "public"."conversations"
    FOR SELECT
    TO "authenticated"
    USING (("service_operator_id" = "auth"."uid"()));

CREATE POLICY "Service operators can update their job conversations"
    ON "public"."conversations"
    FOR UPDATE
    TO "authenticated"
    USING (("service_operator_id" = "auth"."uid"()));


-- ============================================================
-- 9. Geo RPC: find service operators near a job's property
--    Returns operators who are available, offer the service
--    type, and whose stated coverage radius overlaps the
--    property location. Called by notify-service-operators.
-- ============================================================
CREATE OR REPLACE FUNCTION "public"."find_service_operators_near_job"(
    "p_job_id" "uuid",
    "p_service_type" "text"
)
RETURNS TABLE ("id" "uuid")
LANGUAGE "plpgsql"
AS $$
DECLARE
    v_location "extensions"."geography";
BEGIN
    SELECT p."location" INTO v_location
    FROM "public"."service_jobs" sj
    JOIN "public"."properties" p ON p."id" = sj."property_id"
    WHERE sj."id" = p_job_id;

    IF v_location IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT sop."id"
    FROM "public"."service_operator_profiles" sop
    WHERE sop."is_available" = true
      AND sop."services" @> ARRAY[p_service_type]
      AND sop."area_lat" IS NOT NULL
      AND sop."area_lng" IS NOT NULL
      AND "extensions"."ST_DWithin"(
          "extensions"."ST_SetSRID"(
              "extensions"."ST_MakePoint"(sop."area_lng", sop."area_lat"),
              4326
          )::extensions.geography,
          v_location,
          sop."area_radius_km" * 1000
      );
END;
$$;
