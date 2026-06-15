import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../App';
import { fetchRange, fetchDay, deleteMeal, localDate } from '../lib/api';
import { WeekBars } from '../ui/viz';

const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export default function Diary() {
  const { uid, profile, showToast } = useApp();
  const tz = profile?.timezone;
  const [span, setSpan] = useState(7);
  const [range, setRange] = useState(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [day, setDay] = useState(null);

  const reloadRange = useCallback(async () => {
    if (!uid) return;
    try {
      setRange(await fetchRange(uid, localDate(tz, -(span - 1)), localDate(tz)));
    } catch (e) { showToast('Не удалось загрузить период: ' + e.message, true); }
  }, [uid, tz, span, showToast]);

  const reloadDay = useCallback(async () => {
    if (!uid) return;
    try { setDay(await fetchDay(uid, localDate(tz, -dayOffset))); }
    catch (e) { showToast('Не удалось загрузить день: ' + e.message, true); }
  }, [uid, tz, dayOffset, showToast]);

  useEffect(() => { reloadRange(); }, [reloadRange]);
  useEffect(() => { reloadDay(); }, [reloadDay]);

  if (!uid) return <div className="ks-empty">Сначала привяжи Telegram на главной странице.</div>;
  if (!range) return <div className="ks-skeleton" style={{ height: 320 }} />;

  // агрегаты по дням
  const byDay = {};
  for (let i = span - 1; i >= 0; i--) byDay[localDate(tz, -i)] = { cal: 0, w: 0 };
  range.meals.forEach(m => { if (byDay[m.date_local]) byDay[m.date_local].cal += Number(m.calories) || 0; });
  range.water.forEach(w => { if (byDay[w.date_local]) byDay[w.date_local].w += Number(w.volume_ml) || 0; });
  const days = Object.entries(byDay).map(([d, v]) => ({
    label: span <= 7 ? DOW[new Date(d + 'T12:00:00').getDay()] : d.slice(8),
    value: v.cal,
  }));
  const total = range.meals.reduce((a, m) => a + (Number(m.calories) || 0), 0);
  const daysWith = new Set(range.meals.map(m => m.date_local)).size;

  const removeMeal = async (id) => {
    if (!confirm('Удалить запись?')) return;
    try { await deleteMeal(id); showToast('Удалено'); reloadDay(); reloadRange(); }
    catch (e) { showToast('Не удалилось: ' + e.message, true); }
  };

  const dayDate = localDate(tz, -dayOffset);

  return (
    <div>
      <div className="page-head">
        <span className="ks-eyebrow">Дневник</span>
        <h1>Как идёт неделя</h1>
      </div>

      <div className="ks-bento">
        <div className="ks-bento-tile ks-bento-tile--span-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ks-eyebrow">Калории по дням</span>
            <div className="ks-button-row">
              <button className={'ks-button ks-button-sm ' + (span === 7 ? 'ks-button-secondary' : 'ks-button-ghost')} onClick={() => setSpan(7)}>7 дней</button>
              <button className={'ks-button ks-button-sm ' + (span === 30 ? 'ks-button-secondary' : 'ks-button-ghost')} onClick={() => setSpan(30)}>30 дней</button>
            </div>
          </div>
          <WeekBars days={days} target={profile?.calories_target || 0} />
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-4">
          <span className="ks-eyebrow">Итог периода</span>
          <div style={{ margin: '14px 0' }}>
            <span className="stat-num">{daysWith}</span>
            <span className="stat-unit"> / {span} дней с записями</span>
          </div>
          <p className="ks-muted" style={{ margin: 0 }}>
            Всего {Math.round(total)} ккал ·
            в среднем {daysWith ? Math.round(total / daysWith) : 0} ккал в день с записями.
          </p>
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-12">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="ks-eyebrow">Записи · {dayDate}</span>
            <div className="ks-button-row">
              <button className="ks-button ks-button-ghost ks-button-sm" onClick={() => setDayOffset(dayOffset + 1)}>← раньше</button>
              <button className="ks-button ks-button-ghost ks-button-sm" disabled={dayOffset === 0} onClick={() => setDayOffset(dayOffset - 1)}>позже →</button>
            </div>
          </div>
          {!day || day.meals.length === 0
            ? <div className="ks-empty" style={{ marginTop: 12 }}>В этот день записей нет</div>
            : day.meals.map(m => (
              <div className="meal-row" key={m.id}>
                <span>
                  {m.meal_description}
                  <span className="ks-faint" style={{ fontSize: '0.85rem' }}> · Б {Math.round(m.proteins)} Ж {Math.round(m.fats)} У {Math.round(m.carbs)}</span>
                </span>
                <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span className="meal-kcal">{Math.round(m.calories)} ккал</span>
                  <button className="ks-button ks-button-ghost ks-button-sm" onClick={() => removeMeal(m.id)}>удалить</button>
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
