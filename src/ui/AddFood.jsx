import React, { useRef, useState } from 'react';
import { analyzeFood, saveMeal } from '../lib/api';
import { useApp } from '../App';

/* Сжимаем фото до ~1280px, отдаём dataURL */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1280;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function scalePayload(p, factor) {
  const r1 = (v) => Math.round((Number(v) || 0) * factor * 10) / 10;
  const items = (p.items || []).map(it => ({
    ...it, portion_g: r1(it.portion_g), calories: r1(it.calories),
    proteins: r1(it.proteins), carbs: r1(it.carbs), fats: r1(it.fats), fiber: r1(it.fiber),
  }));
  let cal = 0, pr = 0, c = 0, f = 0, fib = 0;
  items.forEach(it => { cal += it.calories; pr += it.proteins; c += it.carbs; f += it.fats; fib += it.fiber; });
  const rt = (v) => Math.round(v * 10) / 10;
  return { ...p, items, totals: { cal: rt(cal), p: rt(pr), c: rt(c), f: rt(f), fib: rt(fib) } };
}

export default function AddFood({ onSaved }) {
  const { uid, profile, showToast } = useApp();
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState(null); // payload от AI
  const [aiMsg, setAiMsg] = useState('');
  const fileRef = useRef(null);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setImage(await fileToDataUrl(f)); }
    catch { showToast('Не удалось прочитать фото', true); }
  };

  const analyze = async () => {
    if (!text.trim() && !image) { showToast('Опиши еду или приложи фото', true); return; }
    setBusy(true); setCard(null); setAiMsg('');
    try {
      const res = await analyzeFood({ text: text.trim(), image });
      if (res.error) throw new Error(res.error);
      setAiMsg(res.ai_message || '');
      if (res.is_food === false || !res.items?.length) {
        setCard(null);
      } else {
        setCard(res);
      }
    } catch (err) {
      showToast('Анализ не удался: ' + err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveMeal(uid, card, profile?.timezone);
      showToast('Сохранено: ' + (card.description || 'приём пищи'));
      setCard(null); setText(''); setImage(''); setAiMsg('');
      onSaved?.();
    } catch (err) {
      showToast('Не сохранилось: ' + err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const t = card?.totals || {};

  return (
    <div>
      <div className="ks-field">
        <label className="ks-label">Что ты съел(а)?</label>
        <textarea className="ks-textarea" rows="2" value={text}
          placeholder="Например: овсянка на молоке с бананом, кофе с сахаром"
          onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="dropzone" onClick={() => fileRef.current?.click()}>
        {image
          ? <img src={image} alt="Фото блюда" />
          : <>Фото блюда — нажми, чтобы выбрать. Подсказка: укажи вес в тексте, и я возьму его.</>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      </div>
      <div className="ks-button-row" style={{ marginTop: 16 }}>
        <button className="ks-button ks-button-primary" onClick={analyze} disabled={busy}>
          {busy ? 'Считаю…' : 'Посчитать КБЖУ'}
        </button>
        {image && (
          <button className="ks-button ks-button-ghost" onClick={() => setImage('')} disabled={busy}>
            Убрать фото
          </button>
        )}
      </div>

      {aiMsg && !card && (
        <p className="ks-muted" style={{ marginTop: 16 }}>{aiMsg}</p>
      )}

      {card && (
        <div className="ks-card" style={{ marginTop: 20, background: 'var(--ks-lacquer-deep)' }}>
          <span className="ks-eyebrow">Карточка</span>
          <h3 style={{ margin: '6px 0 10px' }}>{card.description || 'Приём пищи'}</h3>
          {(card.items || []).map((it, i) => (
            <div className="food-item-row" key={i}>
              <span>{it.name} · {it.portion_g} г</span>
              <span className="meal-kcal">{Math.round(it.calories)} ккал</span>
            </div>
          ))}
          <p style={{ margin: '12px 0 4px' }}>
            Итого: <strong>{Math.round(t.cal || 0)} ккал</strong>
            <span className="ks-faint"> · Б {t.p} · Ж {t.f} · У {t.c} · клетчатка {t.fib}</span>
          </p>
          {aiMsg && <p className="ks-muted" style={{ fontSize: '0.92rem' }}>{aiMsg}</p>}
          <div className="ks-button-row" style={{ marginTop: 12 }}>
            <button className="ks-button ks-button-primary ks-button-sm" onClick={save} disabled={busy}>Сохранить</button>
            <button className="ks-button ks-button-secondary ks-button-sm" onClick={() => setCard(scalePayload(card, 0.7))} disabled={busy}>Порция −30%</button>
            <button className="ks-button ks-button-secondary ks-button-sm" onClick={() => setCard(scalePayload(card, 1.3))} disabled={busy}>Порция +30%</button>
            <button className="ks-button ks-button-ghost ks-button-sm" onClick={() => setCard(null)} disabled={busy}>Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}
