import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch customers with significant debt or overdue bookings
    const { data: riskyCustomers, error: fetchError } = await supabase
      .from("customers")
      .select("id, name, debt_amount, total_bookings")
      .gt("debt_amount", 5000); // Penalty threshold

    if (fetchError) throw fetchError;

    const results = [];

    for (const customer of riskyCustomers || []) {
      // 2. Automate blacklisting for high-risk profiles
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          blacklist_level: 3,
          blacklist_reason: "AUTO: Debt exceeded confidence limit (₹5,000+)",
          blacklisted_at: new Date().toISOString()
        })
        .eq("id", customer.id);

      if (!updateError) {
        results.push({ id: customer.id, name: customer.name, status: "blacklisted" });
        
        // 3. Create notification for branch manager
        await supabase.from("notifications").insert({
          type: "blacklist_attempt",
          title: `Auto-Blacklist: ${customer.name}`,
          body: `Customer blacklisted automatically due to ₹${customer.debt_amount} pending debt.`,
          is_read: false
        });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
