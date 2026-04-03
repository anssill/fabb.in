-- 00004_whatsapp_log.sql
-- WhatsApp message log — manual sends only, no automation

CREATE TABLE public.whatsapp_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  phone text NOT NULL,
  template_type text NOT NULL, -- booking_confirmed/pickup_reminder/return_reminder/overdue_notice/custom
  message_body text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent' -- sent/failed/pending
);

ALTER TABLE public.whatsapp_log ENABLE ROW LEVEL SECURITY;

-- Branch staff can view their branch's log
CREATE POLICY "view_whatsapp_log" ON public.whatsapp_log
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved'
    )
  );

-- Branch staff can insert (send) messages
CREATE POLICY "insert_whatsapp_log" ON public.whatsapp_log
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved'
    )
  );
