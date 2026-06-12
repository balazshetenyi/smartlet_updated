-- Allow landlords to read surveillance reports filed against their own properties.
-- Reporters and admins already have SELECT via existing policies.
CREATE POLICY "Landlords can view reports on their properties"
  ON public.surveillance_reports
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE landlord_id = auth.uid()
    )
  );
