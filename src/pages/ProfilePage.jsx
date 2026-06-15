import React, { useState } from 'react';
import { useApp } from '../App';
import { updateProfile, fetchProfile } from '../lib/api';

const F = ({ label, children }) => (
  <div className="ks-field"><label className="ks-label">{label}</label>{children}</div>
);

const GOALS = { lose: 'Мягко сбросить вес', maintain: 'Поддерживать форму', gain: 'Набрать массу' };
const ACTIVITY = { '1.2': 'Сидячий', '1.375': 'Лёгкая', '1.55': 'Умеренная', '1.725': 'Высокая', '1.9': 'Очень высокая' };

/* Та же формула Миффлина — Сан-Жеора, что в боте */
function recalc({ sex, weight, height, age, activity, goal }) {
  const bmr = (sex === 'male' || sex === 'm')
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  let cal = bmr * activity;
  if (String(goal).includes('lose')) cal -= 400;
  if (String(goal).includes('gain')) cal += 300;
  cal = Math.round(cal);
  const p = Math.round(weight * (String(goal).includes('lose') ? 2.0 : String(goal).includes('gain') ? 1.8 : 1.6));
  const f = Math.round(weight * 0.9);
  const c = Math.max(50, Math.round((cal - p * 4 - f * 9) / 4));
  return { calories_target: cal, protein_target_g: p, fat_target_g: f, carbs_target_g: c };
}

export default function ProfilePage() {
  const { uid, profile, setProfile, showToast } = useApp();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!uid) return <div className="ks-empty">Сначала привяжи Telegram на главной странице.</div>;
  if (!profile) return <div className="ks-empty">Профиль создаётся в боте через /start.</div>;

  const start = () => setForm({
    weight_kg: profile.weight_kg, height_cm: profile.height_cm, age: profile.age,
    goal: profile.goal, activity_pal: String(profile.activity_pal),
    water_target_ml: profile.water_target_ml, timezone: profile.timezone,
  });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const targets = recalc({
        sex: profile.sex,
        weight: parseFloat(form.weight_kg), height: parseFloat(form.height_cm),
        age: parseInt(form.age, 10), activity: parseFloat(form.activity_pal), goal: form.goal,
      });
      await updateProfile(uid, {
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        age: parseInt(form.age, 10),
        goal: form.goal,
        activity_pal: parseFloat(form.activity_pal),
        water_target_ml: parseInt(form.water_target_ml, 10),
        timezone: form.timezone,
        ...targets,
      });
      setProfile(await fetchProfile(uid));
      setForm(null);
      showToast('Профиль обновлён, цели пересчитаны');
    } catch (err) {
      showToast('Не сохранилось: ' + err.message, true);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="page-head">
        <span className="ks-eyebrow">Профиль</span>
        <h1>{profile.name || 'Профиль'}</h1>
      </div>

      <div className="ks-bento">
        <div className="ks-bento-tile ks-bento-tile--span-6">
          <span className="ks-eyebrow">Параметры</span>
          {!form ? (
            <>
              <div style={{ marginTop: 12, lineHeight: 2.1 }}>
                Пол: <strong>{profile.sex === 'male' ? 'мужской' : 'женский'}</strong><br />
                Возраст: <strong>{profile.age}</strong> · Рост: <strong>{profile.height_cm} см</strong> · Вес: <strong>{profile.weight_kg} кг</strong><br />
                Цель: <strong>{GOALS[profile.goal] || profile.goal}</strong><br />
                Активность: <strong>{ACTIVITY[String(profile.activity_pal)] || profile.activity_pal}</strong><br />
                Таймзона: <span className="ks-mono" style={{ textTransform: 'none', letterSpacing: 0 }}>{profile.timezone}</span>
              </div>
              <button className="ks-button ks-button-secondary" style={{ marginTop: 16 }} onClick={start}>
                Изменить
              </button>
            </>
          ) : (
            <form onSubmit={save} style={{ marginTop: 12 }}>
              <F label="Вес, кг"><input className="ks-input" type="number" step="0.1" min="30" max="300" required value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} /></F>
              <F label="Рост, см"><input className="ks-input" type="number" min="100" max="250" required value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} /></F>
              <F label="Возраст"><input className="ks-input" type="number" min="10" max="100" required value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></F>
              <F label="Цель">
                <select className="ks-select" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
                  {Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </F>
              <F label="Активность">
                <select className="ks-select" value={form.activity_pal} onChange={e => setForm({ ...form, activity_pal: e.target.value })}>
                  {Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </F>
              <F label="Цель по воде, мл"><input className="ks-input" type="number" min="500" max="6000" required value={form.water_target_ml} onChange={e => setForm({ ...form, water_target_ml: e.target.value })} /></F>
              <F label="Таймзона (например Europe/Moscow)"><input className="ks-input" required value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} /></F>
              <div className="ks-button-row">
                <button className="ks-button ks-button-primary" disabled={busy}>Сохранить</button>
                <button type="button" className="ks-button ks-button-ghost" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
              </div>
              <p className="ks-faint" style={{ fontSize: '0.85rem' }}>
                Цели КБЖУ пересчитаются автоматически под новые параметры.
              </p>
            </form>
          )}
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-6">
          <span className="ks-eyebrow">Дневные цели</span>
          <div style={{ marginTop: 12, lineHeight: 2.1 }}>
            Калории: <strong>{profile.calories_target} ккал</strong><br />
            Белки: <strong>{profile.protein_target_g} г</strong> ·
            Жиры: <strong>{profile.fat_target_g} г</strong> ·
            Углеводы: <strong>{profile.carbs_target_g} г</strong><br />
            Клетчатка: <strong>{profile.fiber_target_g} г</strong> ·
            Вода: <strong>{profile.water_target_ml} мл</strong>
          </div>
          <p className="ks-faint" style={{ fontSize: '0.9rem' }}>
            Это ориентиры, не жёсткие рамки. Они общие для сайта и бота.
          </p>
        </div>
      </div>
    </div>
  );
}
