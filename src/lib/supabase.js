import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && anon && !url.includes('ВАШ_ПРОЕКТ'));

export const supabase = configured ? createClient(url, anon) : null;

export const N8N_WEB_API = import.meta.env.VITE_N8N_WEB_API || '';
export const TG_BOT = import.meta.env.VITE_TG_BOT || 'netkann_nutritionbot';
