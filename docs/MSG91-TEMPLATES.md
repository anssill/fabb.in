# MSG91 customer templates

Replace YOUR BRAND with your registered business name before DLT approval. These are transactional customer-service messages, not marketing.

| Event | DLT content | MSG91 variables in order |
|---|---|---|
| Booking confirmation | Your booking {#var#} is confirmed. Pickup on {#var#}. - YOUR BRAND | booking_id, pickup_date |
| Payment receipt | Payment of Rs. {#var#} received for booking {#var#}. - YOUR BRAND | amount, booking_id |
| Pickup reminder | Reminder: collect your items for booking {#var#} on {#var#}. - YOUR BRAND | booking_id, pickup_date |
| Return reminder | Reminder: return your items for booking {#var#} by {#var#}. - YOUR BRAND | booking_id, return_date |

1. Register your sender and templates on DLT. Keep each variable within the provider limit.
2. Create corresponding MSG91 flows using the exact approved text. In MSG91, replace DLT variables with named variables such as ##booking_id## and ##pickup_date##.
3. Map each approved DLT template to its MSG91 flow, approve/activate the flow, and paste the MSG91 Flow ID into Settings > SMS.
4. Add MSG91_AUTH_KEY as an encrypted server environment variable in Vercel Production and redeploy. Never store it in client settings or Git.
5. Enable SMS, save settings, and send an approved template from a booking. Payment receipt uses the latest non-voided rental payment. Reminders are manually sent from bookings; saving templates does not schedule automatic delivery.

No SMS was sent during implementation. Account approval, provider credentials and a real delivery test remain prerequisites for live messaging.

Provider references: https://msg91.com/help/dlt-registration-in-india/map-approved-dlt-template-id-with-respective-flow-id-on-msg91-panel and https://msg91.com/help/template/how-to-create-flow-id-to-send-sms-via-api
