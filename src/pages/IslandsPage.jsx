import React, { useEffect, useState } from 'react';
import { useApp } from '../App';
import { fetchIslands, fetchEmotions, fetchMemories } from '../lib/api';
import { IslandTile, EmotionConsole, levelName, ISLAND_META } from '../ui/viz';


const MEMORY_COLORS = {
  yellow: 'var(--ks-kinpaku)', green: 'var(--ks-patina)',
  blue: 'var(--ks-patina-deep)', red: 'var(--ks-vermilion)',
};

export default function IslandsPage() {
  const { uid, showToast } = useApp();
  const [islands, setIslands] = useState(null);
  const [emotions, setEmotions] = useState(null);
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    if (!uid) return;
    Promise.all([fetchIslands(uid), fetchEmotions(uid), fetchMemories(uid)])
      .then(([i, e, m]) => { setIslands(i); setEmotions(e); setMemories(m); })
      .catch((e) => showToast('Не удалось загрузить: ' + e.message, true));
  }, [uid, showToast]);

  if (!uid) return <div className="ks-empty">Сначала привяжи Telegram на главной странице.</div>;
  if (!islands) return <div className="ks-skeleton" style={{ height: 320 }} />;

  const order = ['food', 'movement', 'hydration', 'honesty', 'balance', 'sleep'];
  const sorted = [...islands].sort((a, b) => order.indexOf(a.island_code) - order.indexOf(b.island_code));

  return (
    <div>
      <div className="page-head">
        <span className="ks-eyebrow">Внутренний мир</span>
        <h1>Острова и Пульт Эмоций</h1>
        <p className="ks-muted" style={{ margin: '8px 0 0' }}>
          Каждая запись еды, воды и движения строит острова. Печаль растёт за честность —
          записывай и срывы, это тоже забота о себе.
        </p>
      </div>

      <div className="ks-bento">
        <div className="ks-bento-tile ks-bento-tile--span-12" style={{ padding: 8, background: 'transparent', border: 'none' }}>
          <div className="island-grid">
            {sorted.length === 0
              ? <div className="ks-empty" style={{ gridColumn: '1/-1' }}>Острова появятся после первых записей в боте или здесь</div>
              : sorted.map(i => <IslandTile key={i.island_code} island={i} />)}
          </div>
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <span className="ks-eyebrow">Пульт Эмоций</span>
            {emotions && <span className="ks-badge is-ready">{levelName(emotions)}</span>}
          </div>
          <div style={{ marginTop: 12 }}>
            {emotions
              ? <EmotionConsole emotions={emotions} />
              : <div className="ks-empty">Пульт включится после первых записей</div>}
          </div>
          <p className="ks-faint" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
            Радость любит баланс и воду · Гнев растёт от тренировок · Страх успокаивается от режима ·
            Брезгливость морщится от фастфуда · Печаль ценит честность.
          </p>
        </div>

        <div className="ks-bento-tile ks-bento-tile--span-5">
          <span className="ks-eyebrow">Ядра воспоминаний · {memories.length}</span>
          <div style={{ marginTop: 12 }}>
            {memories.length === 0 && <div className="ks-empty">Первое ядро появится за первую запись еды</div>}
            {memories.map((m) => (
              <div key={m.id || m.code} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--ks-rule)' }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', flex: 'none', position: 'relative', top: 1,
                  background: MEMORY_COLORS[m.color] || 'var(--ks-kinpaku)',
                  boxShadow: '0 0 10px ' + (MEMORY_COLORS[m.color] || 'var(--ks-kinpaku)'),
                }} />
                <span>
                  <strong>{m.title}</strong>
                  <span className="ks-faint" style={{ display: 'block', fontSize: '0.85rem', lineHeight: 1.5 }}>{m.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Справочник островов */}
      <div className="ks-bento-tile ks-bento-tile--span-12" style={{ marginTop: 16 }}>
        <span className="ks-eyebrow">Справочник</span>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>💡 Как устроены Острова Личности</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {Object.entries(ISLAND_META).map(([key, meta]) => (
            <div key={key} style={{ padding: 12, border: '1px solid var(--ks-rule)', borderRadius: 'var(--ks-r-sm)', background: 'var(--ks-lacquer-light)' }}>
              <h4 style={{ color: 'var(--ks-champagne)', margin: 0, fontSize: '0.98rem' }}>
                {meta.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--ks-text-muted)', margin: '6px 0 10px', lineHeight: 1.4 }}>
                {meta.desc}
              </p>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--ks-text-faint)' }}>Условие:</span>
                  <span style={{ color: 'var(--ks-champagne)', textAlign: 'right', marginLeft: 8 }}>{meta.unlock}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--ks-text-faint)' }}>Награда:</span>
                  <span style={{ color: 'var(--ks-patina)', textAlign: 'right', marginLeft: 8 }}>{meta.reward}</span>
                </div>
              </div>
            </div>
          ))}
          {/* Остров Дружбы (поскольку его нет в БД, добавим вручную в легенду) */}
          <div style={{ padding: 12, border: '1px solid var(--ks-rule)', borderRadius: 'var(--ks-r-sm)', background: 'var(--ks-lacquer-light)', opacity: 0.85 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ks-champagne)', margin: 0, fontSize: '0.98rem' }}>
              <span>Остров Дружбы</span>
              <span className="ks-badge" style={{ fontSize: '0.7rem', padding: '1px 5px', color: 'var(--ks-patina)' }}>Скоро</span>
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--ks-text-muted)', margin: '6px 0 10px', lineHeight: 1.4 }}>
              Социальная сфера и общение. Будет развиваться при поддержке друзей и прохождении совместных испытаний.
            </p>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--ks-text-faint)' }}>Условие:</span>
                <span style={{ color: 'var(--ks-champagne)', textAlign: 'right', marginLeft: 8 }}>Поделиться прогрессом с другом</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--ks-text-faint)' }}>Награда:</span>
                <span style={{ color: 'var(--ks-patina)', textAlign: 'right', marginLeft: 8 }}>Совместные челленджи</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
