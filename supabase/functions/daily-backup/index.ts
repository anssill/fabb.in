import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const timestamp = new Date().toISOString().split("T")[0];
    const tables = ["bookings", "customers", "items", "washing_entries", "staff_attendance"];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;

      const fileName = `backups/${timestamp}/${table}.json`;
      const { error: uploadError } = await supabase.storage
        .from("backups")
        .upload(fileName, JSON.stringify(data), {
          contentType: "application/json",
          upsert: true
        });

      if (uploadError) console.error(`Failed to backup ${table}:`, uploadError);
    }

    return new Response(JSON.stringify({ success: true, timestamp, tables }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
