
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('bookings').select('*, customer:customers(*), branch:branches(name, city), created_by_staff:staff!bookings_created_by_fkey(name), booking_items(id, quantity, price, item_name, size, condition_on_return, condition_notes_on_return, item:items(id, name, cover_image_url, sku), variant:item_variants(size, colour)), booking_payments(id, type, amount, method, reference_number, notes, created_at, is_voided, collected_by:staff(name))').limit(1);
console.log(JSON.stringify(error || data, null, 2));
