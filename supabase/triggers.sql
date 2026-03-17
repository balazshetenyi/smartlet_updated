-- Run once manually in Supabase dashboard SQL editor after first db push.
-- Supabase Dashboard → SQL Editor → paste and run.

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
