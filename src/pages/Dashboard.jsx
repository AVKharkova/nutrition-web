import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../App';
import { fetchDay, addWater, localDate, linkTelegram } from '../lib/api';
import { Ring } from '../ui/viz';
import AddFood from '../ui/AddFood';
import TelegramLogin from '../ui/TelegramLogin';

function LinkTgBanner() {
  const { reloadLink, showToast } = useApp();
  const onTg = useCallback(async (user) => {
    try {
      const res = await linkTelegram(user);
      if (res.error) throw new Error(res.error);
      showToast('Telegram привязан, данные бота подключены');
      reloadLink();
    } catch (err) {
      showToast('Привязка не удалась: ' + err.message, true);
    }
  }, [reloadLink, showToast]);

  return (
    <div className="ks-card" style={{ maxWidth: 560, margin: '48px auto' }}>
      <span className="ks-eyebrow">Один шаг</span>
      <h2 style={{ margin: '8px 0 12px' }}>Привяжи Telegram</h2>
      <p className="ks-muted">
        Дневник, эмоции и острова живут в боте. Привяжи свой Telegram-аккаунт,
        и всё появится здесь. Если ты ещё не общался с ботом — начни с него:
        он проведёт регистрацию за пару минут.
      </p>
      <TelegramLogin onAuth={onTg} />
    </div>
  );
}

export default function Dashboard() {
  const { uid, profile, showToast } = useApp();
  const [day, setDay] = useState(null);
  const tz = profile?.timezone;

  const reload = useCallback(async () => {
    if (!uid) return;
    try { setDay(await fetchDay(uid, localDate(tz))); }
    catch (e) { showToast('Не удалось загрузить день: ' + e.message, true); }
  }, [uid, tz, showToast]);

  useEffect(() => { reload(); }, [reload]);

  if (!uid) return <LinkTgBanner />;
  if (!profile) {
    return (
      <div className="ks-empty">
        Профиль ещё не создан. Зайди в бота и пройди короткую регистрацию через /start —
        после этого здесь появятся твои цели и дневник.
      </div>
    );
  }
  if (!day) return <div className="ks-skeleton" style={{ height: 320 }} />;

  const sum = (arr, k) => arr.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  const cal = sum(day.meals, 'calories');
  const p = sum(day.meals, 'proteins');
  const f = sum(day.meals, 'fats');
  const c = sum(day.meals, 'carbs');
  const fib = sum(day.meals, 'fiber');
  const w = sum(day.water, 'volume_ml');
  const left = Math.max(0, (profile.calories_target || 0) - cal);

  const drink = async (ml) => {
    try {
      await addWater(uid, ml, tz);
      showToast(`Записано ${ml} мл воды`);
      reload();
    } catch (e) { showToast('Не записалось: ' + e.message, true); }
  };

  return (
    <div>
      <div className="page-head">
        <span className="ks-eyebrow">{localDate(tz)}</span>
        <h1>Привет, {profile.name || 'друг'}</h1>
        <p className="ks-muted" style={{ margin: '8px 0 0' }}>
          {cal === 0 && w === 0
            ? 'Сегодня пока пусто — запиши первый приём пищи или стакан воды.'
            : `Осталось ${Math.round(left)} ккал до дневного ориентира. Это маяк, не рамка.`}
        </p>
      </div>

      <div className="ks-bento">
        <div className="ks-bento-tile ks-bento-tile--span-8">
          <span className="ks-eyebrow">Прогресс дня</span>
          <div className="rings-row" style={{ marginTop: 16 }}>
            <Ring value={cal} target={profile.calories_target || 0} label="Калории" unit="ккал" size={150} />
            <Ring value={p} target={profile.protein_target_g || 0} label="Белки" unit="г" />
            <Ring value={fib} target={profile.fiber_target_g || 0} label="Клетчатка" unit="г" />
            <Ring value={w} target={profile.water_target_ml || 0} label="Вода" unit="мл" color="var(--ks-patina)" />
          </div>
          <hr className="ks-rule" />
          <p className="ks-faint" style={{ margin: 0, fontSize: '0.9rem' }}>
            Жиры {Math.round(f)} / {profile.fat_target_g} г · Углеводы {Math.round(c)} / {profile.carbs_target_g} г
          </p>
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-4">
          <span className="ks-eyebrow">Вода</span>
          <div style={{ margin: '14px 0' }}>
            <span className="stat-num">{w}</span>
            <span className="stat-unit"> / {profile.water_target_ml} мл</span>
          </div>
          <div className="ks-button-row">
            <button className="ks-button ks-button-secondary ks-button-sm" onClick={() => drink(200)}>+200</button>
            <button className="ks-button ks-button-secondary ks-button-sm" onClick={() => drink(250)}>+250</button>
            <button className="ks-button ks-button-secondary ks-button-sm" onClick={() => drink(500)}>+500</button>
          </div>
          <p className="ks-faint" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
            Страх спокоен, когда воды достаточно.
          </p>
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-6">
          <span className="ks-eyebrow">Записать еду</span>
          <div style={{ marginTop: 12 }}>
            <AddFood onSaved={reload} />
          </div>
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-6">
          <span className="ks-eyebrow">Приёмы пищи сегодня · {day.meals.length}</span>
          <div style={{ marginTop: 8 }}>
            {day.meals.length === 0 && <div className="ks-empty">Записей пока нет</div>}
            {day.meals.map((m) => (
              <div className="meal-row" key={m.id}>
                <span>{m.meal_description}</span>
                <span className="meal-kcal">{Math.round(m.calories)} ккал</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
