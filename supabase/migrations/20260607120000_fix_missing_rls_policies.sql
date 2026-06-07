-- ─────────────────────────────────────────────────────────────────
-- bookings
-- Policies were defined in the remote schema but RLS was never
-- enabled, so none of them were being enforced.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- notifications
-- RLS was not enabled. The existing SELECT policy only covers reads;
-- the client also updates rows to mark them as read, so we add an
-- UPDATE policy scoped to the owner.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- payments
-- RLS was not enabled. The existing SELECT policy already scopes
-- visibility correctly (tenant or landlord of the booking); no
-- client-side INSERT/UPDATE is performed — those go through Edge
-- Functions which use the service role and bypass RLS.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────
-- reports
-- RLS is on but only an INSERT policy exists. Reporters need SELECT
-- so they can check the status of their submission; admins need
-- SELECT and UPDATE to run the resolution workflow.
-- ─────────────────────────────────────────────────────────────────
CREATE POLICY "Reporters can view their own reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- surveillance_reports
-- Reporters can file and see their own reports (existing policies).
-- Admins need to see all pending/investigating reports and update
-- them when resolving an investigation.
-- ─────────────────────────────────────────────────────────────────
CREATE POLICY "Admins can view all surveillance reports"
  ON public.surveillance_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update surveillance reports"
  ON public.surveillance_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- surveillance_report_photos
-- Admins need to view evidence attached to reports they investigate.
-- ─────────────────────────────────────────────────────────────────
CREATE POLICY "Admins can view all report photos"
  ON public.surveillance_report_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- property_surveillance_declarations
-- Existing policies: authenticated users can read; landlords can
-- manage their own. Admins additionally need to set the locked flag
-- after a confirmed breach report.
-- ─────────────────────────────────────────────────────────────────
CREATE POLICY "Admins can update surveillance declarations"
  ON public.property_surveillance_declarations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
