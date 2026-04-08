import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface SMSRequest {
  to: string;
  template_id: string;
  variables?: Record<string, string>;
  business_id: string;
  branch_id?: string;
  customer_id?: string;
  booking_id?: string;
  sent_by: string;
}

const MSG91_API_URL = "https://control.msg91.com/api/v5/otp"; // Using OTP API for templates or Flow API
// Note: Flow API is usually better for templates: https://control.msg91.com/api/v5/flow/

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { to, template_id, variables, business_id, branch_id, customer_id, booking_id, sent_by } = await req.json() as SMSRequest;

    if (!to || !template_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = {
      template_id: template_id,
      short_url: "1",
      recipients: [
        {
          mobiles: to.startsWith("+") ? to.substring(1) : to,
          ...variables
        }
      ]
    };

    console.log("Sending SMS payload:", JSON.stringify(payload));

    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "authkey": Deno.env.get("MSG91_API_KEY") ?? "",
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("MSG91 Response:", JSON.stringify(result));

    // Log to sms_log
    const { error: logError } = await supabase
      .from("sms_log")
      .insert({
        business_id,
        branch_id,
        customer_id,
        booking_id,
        phone: to,
        template_id,
        message: JSON.stringify(variables), // Storing variables as the message body for audit
        status: response.ok ? "sent" : "failed",
        provider_response: result,
        sent_by
      });

    if (logError) {
      console.error("Failed to log SMS:", logError);
    }

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
