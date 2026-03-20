import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    // Verify the requesting user's JWT so we know who to delete
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    // Use anon client to verify the JWT and get the user id
    const supabaseAnon = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAnon.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Use service role client to delete the user from auth.users
    // Cascades will clean up profiles, user_roles, bookings etc. via FK constraints
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
    );

    if (deleteError) throw new Error(deleteError.message);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
