import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { booking_id, customer_phone, template_name, type } = await req.json();

    if (!booking_id || !customer_phone) {
      throw new Error("Missing parameters: booking_id or customer_phone.");
    }

    const payload = {
      messaging_product: "whatsapp",
      to: customer_phone,
      type: "template",
      template: {
        name: template_name,
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: booking_id }]
          }
        ]
      }
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Log the message attempt
    await supabase.from("whatsapp_log").insert({
      booking_id,
      phone: customer_phone,
      template_type: type || "automated",
      message_body: `Sent template: ${template_name} to ${customer_phone}`,
      status: response.status === 200 ? "sent" : "failed",
      sent_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
