# Booking preparation release

New Booking → Items now supports date selection and full availability by item name or code. Each size shows physical stock, peak booked, out now, damaged/missing, available and selected quantities. Availability includes both endpoint dates. Unknown or failed results are not presented as available stock.

Optional customer alteration notes, condition notes and up to ten JPEG/PNG/WebP condition photos can be recorded below the item list. Photos are limited to 5 MB each and stored privately with branch access checks. Saved drafts retain the upload references and request ID. The booking detail page displays the saved notes and images separately from pickup documentation.

Apply supabase/migrations/20261023093424_booking_preparation.sql before releasing the frontend. The migration extends the installed booking function without replacing existing payment, pricing or numbering behavior. It aborts if expected insertion anchors are absent.

Removed and abandoned draft photo references do not delete storage objects. These may need periodic cleanup.
