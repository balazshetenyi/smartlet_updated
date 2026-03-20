-- Replace search_properties with a version that supports geo-radius search.
-- When p_lat + p_lng are provided, results are filtered by ST_DWithin and
-- ordered by proximity (closest first). Falls back to ILIKE text search when
-- no coordinates are given, preserving backward compatibility.

CREATE OR REPLACE FUNCTION search_properties(
  p_location    TEXT    DEFAULT NULL,
  p_lat         FLOAT   DEFAULT NULL,
  p_lng         FLOAT   DEFAULT NULL,
  p_radius_km   FLOAT   DEFAULT 30,
  p_check_in    DATE    DEFAULT NULL,
  p_check_out   DATE    DEFAULT NULL,
  p_guests      INT     DEFAULT NULL,
  p_rental_type TEXT    DEFAULT NULL,
  p_min_price   NUMERIC DEFAULT NULL,
  p_max_price   NUMERIC DEFAULT NULL,
  p_page        INT     DEFAULT 0,
  p_page_size   INT     DEFAULT 20
)
RETURNS SETOF properties
LANGUAGE plpgsql
STABLE
AS $$
BEGIN

  -- ── Geo-radius path ──────────────────────────────────────────────────────
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    RETURN QUERY
      SELECT p.*
      FROM properties p
      WHERE
        p.is_available = TRUE

        -- Only consider properties that have a stored location point
        AND p.location IS NOT NULL

        -- ST_DWithin uses metres; convert km → m
        AND extensions.ST_DWithin(
              p.location::extensions.geography,
              extensions.ST_MakePoint(p_lng, p_lat)::extensions.geography,
              p_radius_km * 1000
            )

        AND (p_guests      IS NULL OR p.max_guests  >= p_guests)
        AND (p_rental_type IS NULL OR p.rental_type  = p_rental_type)
        AND (p_min_price   IS NULL OR p.price       >= p_min_price)
        AND (p_max_price   IS NULL OR p.price       <= p_max_price)

        AND (
          p_check_in IS NULL OR p_check_out IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.property_id = p.id
              AND b.status != 'cancelled'
              AND b.check_in  < p_check_out
              AND b.check_out > p_check_in
          )
        )

      -- Closest properties first
      ORDER BY
        extensions.ST_Distance(
          p.location::extensions.geography,
          extensions.ST_MakePoint(p_lng, p_lat)::extensions.geography
        ) ASC
      LIMIT  p_page_size
      OFFSET p_page * p_page_size;

  -- ── Text-fallback path ───────────────────────────────────────────────────
  ELSE
    RETURN QUERY
      SELECT p.*
      FROM properties p
      WHERE
        p.is_available = TRUE

        AND (
          p_location IS NULL
          OR p.city    ILIKE '%' || p_location || '%'
          OR p.address ILIKE '%' || p_location || '%'
        )

        AND (p_guests      IS NULL OR p.max_guests  >= p_guests)
        AND (p_rental_type IS NULL OR p.rental_type  = p_rental_type)
        AND (p_min_price   IS NULL OR p.price       >= p_min_price)
        AND (p_max_price   IS NULL OR p.price       <= p_max_price)

        AND (
          p_check_in IS NULL OR p_check_out IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.property_id = p.id
              AND b.status != 'cancelled'
              AND b.check_in  < p_check_out
              AND b.check_out > p_check_in
          )
        )

      ORDER BY p.created_at DESC
      LIMIT  p_page_size
      OFFSET p_page * p_page_size;
  END IF;

END;
$$;
