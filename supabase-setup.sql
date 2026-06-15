-- ============================================================
-- Настройка Supabase для сайта Nutrition
-- Выполни целиком в Supabase: SQL Editor -> New query -> Run
-- ============================================================

-- 1. Связка веб-аккаунтов (auth.users) с Telegram user_id бота
create table if not exists public.web_links (
  auth_uid   uuid primary key references auth.users (id) on delete cascade,
  user_id    bigint not null,
  created_at timestamptz not null default now()
);

-- 2. Helper: tg user_id текущего веб-пользователя
create or replace function public.get_my_user_id()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select user_id from public.web_links where auth_uid = auth.uid();
$$;

grant execute on function public.get_my_user_id() to authenticated;

-- 3. Включаем RLS на таблицах бота.
--    Бот (n8n) подключается ролью postgres - на неё RLS не действует
--    (в Supabase у роли postgres стоит BYPASSRLS), бот продолжит работать.
alter table public.profile        enable row level security;
alter table public.meals          enable row level security;
alter table public.water          enable row level security;
alter table public.emotions       enable row level security;
alter table public.user_islands   enable row level security;
alter table public.core_memories  enable row level security;
alter table public.emotion_events enable row level security;

-- 4. Политики: веб-пользователь видит и меняет только свои строки
drop policy if exists web_profile_select on public.profile;
create policy web_profile_select on public.profile
  for select to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_profile_update on public.profile;
create policy web_profile_update on public.profile
  for update to authenticated
  using (user_id = public.get_my_user_id())
  with check (user_id = public.get_my_user_id());

drop policy if exists web_meals_select on public.meals;
create policy web_meals_select on public.meals
  for select to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_meals_insert on public.meals;
create policy web_meals_insert on public.meals
  for insert to authenticated with check (user_id = public.get_my_user_id());

drop policy if exists web_meals_delete on public.meals;
create policy web_meals_delete on public.meals
  for delete to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_water_select on public.water;
create policy web_water_select on public.water
  for select to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_water_insert on public.water;
create policy web_water_insert on public.water
  for insert to authenticated with check (user_id = public.get_my_user_id());

drop policy if exists web_water_delete on public.water;
create policy web_water_delete on public.water
  for delete to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_emotions_select on public.emotions;
create policy web_emotions_select on public.emotions
  for select to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_islands_select on public.user_islands;
create policy web_islands_select on public.user_islands
  for select to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_memories_select on public.core_memories;
create policy web_memories_select on public.core_memories
  for select to authenticated using (user_id = public.get_my_user_id());

drop policy if exists web_emo_events_select on public.emotion_events;
create policy web_emo_events_select on public.emotion_events
  for select to authenticated using (user_id = public.get_my_user_id());

-- 5. Проверка: под анонимным ключом без входа таблицы должны быть пустыми.
--    Если бот вдруг перестал писать в БД - выполни: alter role postgres bypassrls;
