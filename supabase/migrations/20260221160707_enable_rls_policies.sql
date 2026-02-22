-- Enable Row Level Security
ALTER TABLE "public"."amenities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."property_amenities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- Amenities: Read-only for all authenticated users
CREATE POLICY "Allow read access to amenities for authenticated users"
ON "public"."amenities" FOR SELECT TO authenticated USING (true);

-- Property Amenities: Read for all, manage for landlords
CREATE POLICY "Allow read access to property_amenities for authenticated users"
ON "public"."property_amenities" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Landlords can manage amenities for their own properties"
ON "public"."property_amenities"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_amenities.property_id
    AND properties.landlord_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_amenities.property_id
    AND properties.landlord_id = auth.uid()
  )
);

-- Bookings: Tenants can see/manage their own, Landlords can see/manage their properties
CREATE POLICY "Tenants can view and manage their own bookings"
ON "public"."bookings"
FOR ALL TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Landlords can view and update bookings for their properties"
ON "public"."bookings"
FOR SELECT TO authenticated
                             USING (
                             EXISTS (
                             SELECT 1 FROM public.properties
                             WHERE properties.id = bookings.property_id
                             AND properties.landlord_id = auth.uid()
                             )
                             );

CREATE POLICY "Landlords can update status of bookings for their properties"
ON "public"."bookings"
FOR UPDATE TO authenticated
               USING (
               EXISTS (
               SELECT 1 FROM public.properties
               WHERE properties.id = bookings.property_id
               AND properties.landlord_id = auth.uid()
               )
               );

-- Payments: Visible to the involved tenant and landlord
CREATE POLICY "Users can view payments related to their bookings"
ON "public"."payments"
FOR SELECT TO authenticated
               USING (
               EXISTS (
               SELECT 1 FROM public.bookings
               LEFT JOIN public.properties ON properties.id = bookings.property_id
               WHERE bookings.id = payments.booking_id
               AND (bookings.tenant_id = auth.uid() OR properties.landlord_id = auth.uid())
               )
               );

-- User Roles: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON "public"."user_roles"
FOR SELECT TO authenticated
               USING (user_id = auth.uid());
