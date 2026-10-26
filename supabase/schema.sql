-- רשימת קניות: schema for the shared shopping list.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- There is no auth: it is a private household list. Every row carries a list_key
-- (a long random string, VITE_LIST_KEY) and the app only reads and writes its own key.

-- Items --------------------------------------------------------------------

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  list_key    text not null,
  name        text not null check (length(trim(name)) > 0),
  quantity    text,
  note        text,
  category    text,
  added_by    text,
  bought      boolean not null default false,
  bought_by   text,
  bought_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  source      text not null default 'web' check (source in ('web', 'nano'))
);

create index if not exists items_list_key_idx on public.items (list_key);

-- Full old rows on update/delete, so realtime DELETE events carry list_key.
alter table public.items replica identity full;

-- History ------------------------------------------------------------------

create table if not exists public.item_events (
  id         bigserial primary key,
  list_key   text not null,
  item_id    uuid,
  item_name  text,
  action     text not null check (action in ('added', 'bought', 'unbought', 'deleted', 'edited', 'cleared')),
  actor      text,
  source     text,
  at         timestamptz not null default now()
);

create index if not exists item_events_list_key_at_idx on public.item_events (list_key, at desc);

-- Triggers -----------------------------------------------------------------

-- Who made the change and from where. The web app sends x-ntb-actor / x-ntb-source
-- headers (PostgREST exposes them as request.headers); clear_bought() sets ntb.* itself.
create or replace function public.ntb_request_value(header text, setting text)
returns text language plpgsql stable as $$
declare
  v text;
begin
  v := nullif(current_setting(setting, true), '');
  if v is null then
    begin
      v := nullif(current_setting('request.headers', true)::json ->> header, '');
    exception when others then
      v := null;
    end;
  end if;
  return v;
end $$;

create or replace function public.items_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.items_touch_updated_at();

create or replace function public.items_log_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor  text := public.ntb_request_value('x-ntb-actor', 'ntb.actor');
  v_source text := public.ntb_request_value('x-ntb-source', 'ntb.source');
  v_action text;
begin
  if tg_op = 'INSERT' then
    insert into item_events (list_key, item_id, item_name, action, actor, source)
    values (new.list_key, new.id, new.name, 'added', coalesce(new.added_by, v_actor), coalesce(new.source, v_source));
    return new;
  elsif tg_op = 'UPDATE' then
    if new.bought and not old.bought then
      v_action := 'bought';
    elsif old.bought and not new.bought then
      v_action := 'unbought';
    elsif (new.name, new.quantity, new.note, new.category) is distinct from (old.name, old.quantity, old.note, old.category) then
      v_action := 'edited';
    else
      return new;
    end if;
    insert into item_events (list_key, item_id, item_name, action, actor, source)
    values (
      new.list_key, new.id, new.name, v_action,
      case when v_action = 'bought' then coalesce(new.bought_by, v_actor) else v_actor end,
      coalesce(v_source, new.source)
    );
    return new;
  else -- DELETE
    insert into item_events (list_key, item_id, item_name, action, actor, source)
    values (
      old.list_key, old.id, old.name,
      coalesce(nullif(current_setting('ntb.action', true), ''), 'deleted'),
      v_actor, v_source
    );
    return old;
  end if;
end $$;

drop trigger if exists items_log_event on public.items;
create trigger items_log_event
  after insert or update or delete on public.items
  for each row execute function public.items_log_event();

-- "נקה את מה שנקנה": deletes the bought items of a list, logged as 'cleared'.
create or replace function public.clear_bought(p_list_key text, p_actor text default null, p_source text default 'web')
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  perform set_config('ntb.action', 'cleared', true);
  perform set_config('ntb.actor', coalesce(p_actor, ''), true);
  perform set_config('ntb.source', coalesce(p_source, ''), true);
  delete from items where list_key = p_list_key and bought;
  get diagnostics n = row_count;
  perform set_config('ntb.action', '', true);
  return n;
end $$;

grant execute on function public.clear_bought(text, text, text) to anon, authenticated;

-- Row level security -------------------------------------------------------
-- No auth: the unguessable list_key is the "security". The app filters by it.

alter table public.items enable row level security;
alter table public.item_events enable row level security;

drop policy if exists items_select on public.items;
drop policy if exists items_insert on public.items;
drop policy if exists items_update on public.items;
drop policy if exists items_delete on public.items;
create policy items_select on public.items for select to anon, authenticated using (true);
create policy items_insert on public.items for insert to anon, authenticated with check (true);
create policy items_update on public.items for update to anon, authenticated using (true) with check (true);
create policy items_delete on public.items for delete to anon, authenticated using (true);

drop policy if exists item_events_select on public.item_events;
drop policy if exists item_events_insert on public.item_events;
create policy item_events_select on public.item_events for select to anon, authenticated using (true);
create policy item_events_insert on public.item_events for insert to anon, authenticated with check (true);

grant select, insert, update, delete on public.items to anon, authenticated;
grant select, insert on public.item_events to anon, authenticated;
grant usage, select on sequence public.item_events_id_seq to anon, authenticated;

-- Realtime -----------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;
