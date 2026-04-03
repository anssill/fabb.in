import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { data: branches, error: branchError } = await supabase.from("branches").select("id, name, settings");
    if (branchError) throw branchError;

    const summary = [];

    for (const branch of branches) {
      const threshold = branch.settings?.low_stock_threshold || 2;

      const { data: stock, error: stockError } = await supabase
        .from("items")
        .select("id, name, sku, category")
        .eq("branch_id", branch.id)
        .eq("status", "available");

      if (stockError) throw stockError;

      // Group by SKU and count available
      const skuCounts = stock.reduce((acc, obj) => {
        const key = obj.sku;
        if (!acc[key]) acc[key] = { name: obj.name, count: 0 };
        acc[key].count++;
        return acc;
      }, {});

      for (const sku in skuCounts) {
        if (skuCounts[sku].count <= threshold) {
          // Low stock alert
          await supabase.from("notifications").insert({
            branch_id: branch.id,
            type: "low_stock",
            title: `Low Stock: ${skuCounts[sku].name}`,
            body: `Only ${skuCounts[sku].count} items left for SKU ${sku}. Threshold: ${threshold}.`,
            is_read: false
          });
          summary.push({ branch: branch.name, sku, count: skuCounts[sku].count });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: summary.length, details: summary }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
