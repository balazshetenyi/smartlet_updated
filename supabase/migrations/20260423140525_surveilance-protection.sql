-- ─────────────────────────────────────────────────────────────────
-- Table 1: property_surveillance_declarations
--
-- One row per property. Upserted whenever the landlord updates
-- their declaration. No history kept — only the latest state.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE public.property_surveillance_declarations (
  property_id                  uuid        PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id                  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What the landlord declared
  declaration_type             text        NOT NULL
    CHECK (declaration_type IN ('none', 'external_only')),
  external_devices_description text,       -- required when declaration_type = 'external_only'

  -- Timestamps
  declared_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),

  -- Lockout — set by an admin after a confirmed report
  locked                       boolean     NOT NULL DEFAULT false,
  locked_at                    timestamptz,
  locked_reason                text
);

COMMENT ON TABLE public.property_surveillance_declarations IS
  'One row per property. Stores the landlord''s current surveillance
   declaration. Upserted on update — no history is kept.
   A property is only bookable when a row exists and locked = false.';

COMMENT ON COLUMN public.property_surveillance_declarations.declaration_type IS
  'none = no surveillance devices of any kind inside the property.
   external_only = only external devices (e.g. doorbell cam, exterior CCTV),
   described in external_devices_description.';


-- ─────────────────────────────────────────────────────────────────
-- Table 2: surveillance_reports
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE public.surveillance_reports (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      uuid        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reporter_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  description      text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'investigating', 'resolved_breach', 'resolved_no_breach')),

  created_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz,
  resolved_by      uuid        REFERENCES auth.users(id),
  resolution_notes text
);

COMMENT ON TABLE public.surveillance_reports IS
  'Tenant reports of suspected undisclosed surveillance devices.';


-- ─────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.property_surveillance_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_reports               ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read the declaration for a property
-- (needed to display the badge on the listing page)
CREATE POLICY "Public read of declarations"
  ON public.property_surveillance_declarations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Landlords can insert and update their own declarations
CREATE POLICY "Landlords manage own declarations"
  ON public.property_surveillance_declarations
  FOR ALL
  USING  (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

-- Tenants can file a report
CREATE POLICY "Tenants can file reports"
  ON public.surveillance_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Reporters can only see their own reports
CREATE POLICY "Reporters see own reports"
  ON public.surveillance_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);
