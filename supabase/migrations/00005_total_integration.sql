-- 00005_total_integration.sql
-- This migration formalizes links across all modules and enables global realtime.

-- 1. Harmonize Audit Log
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_business ON public.audit_log(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_branch ON public.audit_log(branch_id);

-- 2. Formalize Washing Queue Links
ALTER TABLE public.washing_queue 
  DROP CONSTRAINT IF EXISTS washing_queue_item_id_fkey,
  DROP CONSTRAINT IF EXISTS washing_queue_variant_id_fkey,
  DROP CONSTRAINT IF EXISTS washing_queue_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS washing_queue_assigned_to_fkey;

ALTER TABLE public.washing_queue
  ADD CONSTRAINT washing_queue_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE,
  ADD CONSTRAINT washing_queue_item_variant_id_fkey FOREIGN KEY (item_variant_id) REFERENCES public.item_variants(id) ON DELETE SET NULL,
  ADD CONSTRAINT washing_queue_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT washing_queue_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD CONSTRAINT washing_queue_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.staff(id) ON DELETE SET NULL;

-- 3. Formalize Expense Links
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_staff_id_fkey,
  DROP CONSTRAINT IF EXISTS expenses_washing_entry_id_fkey;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD CONSTRAINT expenses_washing_entry_id_fkey FOREIGN KEY (washing_entry_id) REFERENCES public.washing_queue(id) ON DELETE SET NULL;

-- 4. Formalize WhatsApp Log Links
ALTER TABLE public.whatsapp_log
  DROP CONSTRAINT IF EXISTS whatsapp_log_customer_id_fkey,
  DROP CONSTRAINT IF EXISTS whatsapp_log_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS whatsapp_log_staff_id_fkey;

ALTER TABLE public.whatsapp_log
  ADD CONSTRAINT whatsapp_log_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
  ADD CONSTRAINT whatsapp_log_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  ADD CONSTRAINT whatsapp_log_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

-- 4.1. Formalize SMS Log Links
ALTER TABLE public.sms_log
  DROP CONSTRAINT IF EXISTS sms_log_customer_id_fkey,
  DROP CONSTRAINT IF EXISTS sms_log_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS sms_log_sent_by_fkey;

ALTER TABLE public.sms_log
  ADD CONSTRAINT sms_log_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
  ADD CONSTRAINT sms_log_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  ADD CONSTRAINT sms_log_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.staff(id) ON DELETE SET NULL;

-- 5. Staff Performance Targets Links
ALTER TABLE public.staff_performance_targets
  DROP CONSTRAINT IF EXISTS staff_performance_targets_branch_id_fkey;

ALTER TABLE public.staff_performance_targets
  ADD CONSTRAINT staff_performance_targets_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;

-- 6. Unified RLS Policies for Linked Tables
-- Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view their branch audit log" ON public.audit_log;
CREATE POLICY "Staff can view their branch audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid()) OR
    business_id IN (SELECT business_id FROM public.staff WHERE id = auth.uid() AND role IN ('owner', 'super_admin'))
  );

-- 7. Enable Realtime Publications
-- First, ensure a publication exists or use the default one
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add operational tables to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.washing_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;

-- 8. Add useful view for joined dashboard stats (optional but helpful)
CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT 
  b.branch_id,
  count(CASE WHEN b.status = 'active' THEN 1 END) as active_rentals,
  count(CASE WHEN b.pickup_date = CURRENT_DATE THEN 1 END) as pickups_today,
  count(CASE WHEN b.return_date = CURRENT_DATE THEN 1 END) as returns_today,
  count(CASE WHEN b.status = 'overdue' THEN 1 END) as overdue_count
FROM public.bookings b
GROUP BY b.branch_id;
