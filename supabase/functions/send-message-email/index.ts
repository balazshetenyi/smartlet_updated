import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {headers: corsHeaders});
    }

    try {
        const {conversationId, senderId, messageContent} = await req.json();

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const resendApiKey = Deno.env.get("RESEND_API_KEY");

        if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Get conversation details
        const {data: conversation} = await supabaseAdmin
            .from("conversations")
            .select(`
        *,
        landlord:profiles!landlord_id (id, first_name, last_name, email),
        tenant:profiles!tenant_id (id, first_name, last_name, email),
        property:properties!property_id (title)
      `)
            .eq("id", conversationId)
            .single();

        if (!conversation) throw new Error("Conversation not found");

        // Get sender details
        const {data: sender} = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", senderId)
            .single();

        if (!sender) throw new Error("Sender not found");

        // Determine recipient
        const recipient =
            senderId === conversation.landlord_id
                ? conversation.tenant
                : conversation.landlord;

        if (!recipient?.email) {
            return new Response(JSON.stringify({ok: true, skipped: true}), {
                headers: {...corsHeaders, "Content-Type": "application/json"},
                status: 200,
            });
        }

        const senderName = `${sender.first_name} ${sender.last_name}`;
        const propertyTitle = conversation.property?.title || "Property";
        const messagePreview = messageContent || "Sent an attachment";

        const subject = `New message from ${senderName} - ${propertyTitle}`;
        const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">New Message on Kiado App</h2>
        <p><strong>${senderName}</strong> sent you a message about <strong>${propertyTitle}</strong>:</p>
        <blockquote style="border-left: 3px solid #007AFF; padding-left: 15px; color: #555; margin: 20px 0;">
          ${messagePreview}
        </blockquote>
        <p>
          <a href="kiado://messages/${conversationId}" 
             style="background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">
            View Message
          </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This email was sent because you have a Kiado App account. You can manage your notification preferences in the app settings.
        </p>
      </div>
    `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Kiado App <no-reply@kiado.mozaiksoftwaresolutions.com>",
                to: [recipient.email],
                subject,
                html,
            }),
        });

        if (!emailResponse.ok) {
            throw new Error("Failed to send email");
        }

        return new Response(JSON.stringify({ok: true}), {
            headers: {...corsHeaders, "Content-Type": "application/json"},
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({error: (error as Error).message}), {
            headers: {...corsHeaders, "Content-Type": "application/json"},
            status: 400,
        });
    }
});
