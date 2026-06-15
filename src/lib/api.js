import { supabase, N8N_WEB_API } from './supabase';

/* Локальная дата в таймзоне профиля (как в боте) */
export function localDate(tz, shiftDays = 0) {
  const d = new Date(Date.now() + shiftDays * 86400000);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'Europe/Moscow',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/* tg user_id текущего пользователя (через RPC, см. supabase-setup.sql) */
export async function getMyUserId() {
  const { data, error } = await supabase.rpc('get_my_user_id');
  if (error) throw error;
  return data; // bigint | null
}

export async function fetchProfile(uid) {
  const { data, error } = await supabase
    .from('profile').select('*').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(uid, fields) {
  const { error } = await supabase
    .from('profile').update({ ...fields, updated_at: new Date().toISOString() })
    .eq('user_id', uid);
  if (error) throw error;
}

export async function fetchDay(uid, dateLocal) {
  const [meals, water] = await Promise.all([
    supabase.from('meals').select('*').eq('user_id', uid).eq('date_local', dateLocal)
      .order('timestamp_iso', { ascending: true }),
    supabase.from('water').select('*').eq('user_id', uid).eq('date_local', dateLocal),
  ]);
  if (meals.error) throw meals.error;
  if (water.error) throw water.error;
  return { meals: meals.data || [], water: water.data || [] };
}

export async function fetchRange(uid, from, to) {
  const [meals, water] = await Promise.all([
    supabase.from('meals').select('date_local, calories, proteins, carbs, fats, fiber')
      .eq('user_id', uid).gte('date_local', from).lte('date_local', to),
    supabase.from('water').select('date_local, volume_ml')
      .eq('user_id', uid).gte('date_local', from).lte('date_local', to),
  ]);
  if (meals.error) throw meals.error;
  if (water.error) throw water.error;
  return { meals: meals.data || [], water: water.data || [] };
}

export async function fetchIslands(uid) {
  const { data, error } = await supabase
    .from('user_islands').select('*').eq('user_id', uid).eq('hidden', false);
  if (error) throw error;
  return data || [];
}

export async function fetchEmotions(uid) {
  const { data, error } = await supabase
    .from('emotions').select('*').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMemories(uid) {
  const { data, error } = await supabase
    .from('core_memories').select('*').eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) {
    // таблица может отличаться — не валим страницу
    return [];
  }
  return data || [];
}

export async function addWater(uid, ml, tz) {
  const { error } = await supabase.from('water').insert({
    user_id: uid,
    timestamp_iso: new Date().toISOString(),
    date_local: localDate(tz),
    volume_ml: ml,
  });
  if (error) throw error;
}

export async function saveMeal(uid, payload, tz) {
  const t = payload.totals || {};
  const { error } = await supabase.from('meals').insert({
    user_id: uid,
    timestamp_iso: new Date().toISOString(),
    date_local: localDate(tz),
    meal_type: payload.meal_type || 'snack',
    meal_description: payload.description || 'Приём пищи',
    calories: t.cal || 0,
    proteins: t.p || 0,
    carbs: t.c || 0,
    fats: t.f || 0,
    fiber: t.fib || 0,
    source: 'web',
    confidence: payload.confidence || 0.7,
    status: 'confirmed',
  });
  if (error) throw error;
}

export async function deleteMeal(id) {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
}

/* ---- n8n web backend ---- */
async function callBackend(action, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(N8N_WEB_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, access_token: session?.access_token || null, ...body }),
  });
  if (!res.ok) throw new Error('Сервис недоступен (' + res.status + ')');
  return res.json();
}

/* AI-анализ еды: text и/или image (dataURL) */
export function analyzeFood({ text, image }) {
  return callBackend('analyze', { text: text || '', image: image || '' });
}

/* Вход через Telegram Login Widget: payload от виджета -> token_hash */
export async function tgAuth(tgPayload) {
  const res = await fetch(N8N_WEB_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'tg_auth', tg: tgPayload }),
  });
  if (!res.ok) throw new Error('Сервис недоступен (' + res.status + ')');
  return res.json(); // { token_hash } | { error }
}

/* Привязка ТГ к email-аккаунту */
export function linkTelegram(tgPayload) {
  return callBackend('link_tg', { tg: tgPayload });
}
