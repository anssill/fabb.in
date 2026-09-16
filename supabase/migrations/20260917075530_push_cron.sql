-- Credentials are provisioned separately in Vault, never embedded in migrations.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if exists(select 1 from cron.job where jobname='fabb-web-push') then perform cron.unschedule('fabb-web-push'); end if;
 perform cron.schedule('fabb-web-push','*/5 * * * *', $job$
  select net.http_post(
   url:='https://www.fabbclothing.com/api/notifications/push/worker',
   headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='fabb_push_worker_secret' limit 1)),
   body:='{}'::jsonb, timeout_milliseconds:=55000
  ) where exists(select 1 from vault.secrets where name='fabb_push_worker_secret');
 $job$);
end $$;
