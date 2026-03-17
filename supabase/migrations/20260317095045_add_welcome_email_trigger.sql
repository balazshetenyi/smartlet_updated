-- The welcome-email trigger uses supabase_functions.http_request which is
-- provisioned by Supabase after the database is created. It must be in its
-- own migration (not the initial schema dump) so it runs after the extension
-- is available.
--
-- The function URL is derived from app.settings.supabase_url which Supabase
-- sets automatically on every project — no hardcoded URLs.

DO $$
DECLARE
  v_url text := current_setting('app.settings.supabase_url', true)
                || '/functions/v1/welcome-email';
BEGIN
  EXECUTE format(
    $trig$
      CREATE OR REPLACE TRIGGER send_welcome_email
        AFTER INSERT ON public.waitlist
        FOR EACH ROW
        EXECUTE FUNCTION supabase_functions.http_request(
          %L, 'POST',
          '{"Content-type":"application/json"}',
          '{}',
          '5000'
        )
    $trig$,
    v_url
  );
END;
$$;
