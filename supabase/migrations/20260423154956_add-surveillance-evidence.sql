-- ─────────────────────────────────────────────────────────────────
-- Table: surveillance_report_photos
-- Stores evidence photos attached to a surveillance report.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE public.surveillance_report_photos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid        NOT NULL REFERENCES public.surveillance_reports(id) ON DELETE CASCADE,
  photo_url   text        NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surveillance_report_photos ENABLE ROW LEVEL SECURITY;

-- Reporter can insert photos for their own reports
CREATE POLICY "Reporter can upload report photos"
  ON public.surveillance_report_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT reporter_id FROM public.surveillance_reports WHERE id = report_id
    )
  );

-- Reporter and admins can read photos for their own reports
CREATE POLICY "Reporter can view own report photos"
  ON public.surveillance_report_photos
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT reporter_id FROM public.surveillance_reports WHERE id = report_id
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- Storage bucket: report-evidence
-- ─────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload report evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'report-evidence');

CREATE POLICY "Public read access for report evidence"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'report-evidence');

CREATE POLICY "Reporters can delete their own evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
