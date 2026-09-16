export const SMS_TEMPLATES = [
  { key: 'booking_confirmed', label: 'Booking confirmation', default: 'Your booking {booking_id} is confirmed. Pickup on {pickup_date}. - FABB', variables: ['{booking_id}', '{pickup_date}'] },
  { key: 'payment_receipt', label: 'Payment receipt', default: 'Payment of Rs. {amount} received for booking {booking_id}. - FABB', variables: ['{amount}', '{booking_id}'] },
  { key: 'pickup_reminder', label: 'Pickup reminder', default: 'Reminder: collect your items for booking {booking_id} on {pickup_date}. - FABB', variables: ['{booking_id}', '{pickup_date}'] },
  { key: 'return_reminder', label: 'Return reminder', default: 'Reminder: return your items for booking {booking_id} by {return_date}. - FABB', variables: ['{booking_id}', '{return_date}'] },
]
