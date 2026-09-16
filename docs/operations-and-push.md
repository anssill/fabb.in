# Rental operations and Web Push

Bookings close after a return or final rental payment when every issued piece is physically received and the rental balance is zero. Missing quantities remain outstanding. Refundable deposits are tracked separately and can be settled from a closed booking. Historical booking statuses are not backfilled.

Pickup, return, payment and deposit commands run in database transactions. Callers must reuse an idempotency key when retrying the same request. Changing a request under an existing key is rejected. Customer summaries use actual non-void payments and current-branch bookings; deposits are excluded from spent totals.

Owners manage staff access under Staff → Branch access. A permanent home branch is separate from the active branch. Additional branches require both the switching permission and membership. Database policies enforce the selection. New staff start without branch switching; the owner can configure it after creation.

## Enable notifications

Each staff member opens Notifications and selects Enable notifications on each device. Branch owners/managers with settings permission configure event types and reminder times under Settings → Push Notifications. Pickup and return reminders default to 18:00 the previous day in the business timezone. Overdue reminders default to 18:00 each day after the return date. Browser and operating-system permission are required.

- iPhone/iPad: Safari → Share → Add to Home Screen, open the installed app, sign in and enable notifications. Requires iOS/iPadOS 16.4 or later.
- Android: open in a compatible browser, enable notifications and accept permission. Installation is optional where supported.
- Desktop: enable notifications and allow browser/OS notifications.

Unsupported or blocked devices retain in-app notifications. Sign out on shared devices to remove the current device subscription. Alerts contain only the event and branch. Opening an alert requires the normal authenticated, authorized application route.

## Deployment configuration

Production requires NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and PUSH_WORKER_SECRET. Only the public key is browser-readable. Store the identical worker secret in Supabase Vault as fabb_push_worker_secret. Never put private values in migrations or version control.

The push_cron migration schedules fabb-web-push every five minutes through pg_cron and pg_net. It posts to /api/notifications/push/worker with the Vault secret. The worker claims at most 50 messages, checks current branch/feature access and reminder configuration, and retries temporary failures up to five attempts. Expired subscriptions are removed. Outbox dedupe keys, database claims and stable browser notification tags reduce duplicates; Web Push cannot guarantee exactly-once display after a network acknowledgement is lost.

Inspect message_outbox status/attempt_count/last_error and cron.job_run_details for failures. Provider response bodies and device endpoints are not written to failure logs. Actual delivery still requires a compatible device and its permission; simulator checks do not replace real-device confirmation.

## Verification

Run `node --test tests/*.test.mjs`, TypeScript, lint and a production build. Database tests use an isolated in-memory PostgreSQL database with synthetic records; they never connect to production. Coverage includes returns, rollback, retries, final payment, deposit settlement, customer totals, branch RLS, default-branch changes, reminder duplicates/revocation, endpoint validation and push failure handling.

The authorized test-data cleanup backup is intentionally local and excluded from Git under scratch/backups/fabb-test-cleanup. Its snapshot, reviewed IDs, deletion manifest, uploaded-file backup/checksum and completion report must be retained. Restore only those reviewed records with FK-aware ordering after checking for new conflicting records; never replace the full business with the snapshot.
