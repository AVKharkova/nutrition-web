/* Визуализации: кольца, бары недели, острова, эмоции. Чистый SVG в токенах кита. */

const GOLD = 'var(--ks-kinpaku)';
const GOLD_DEEP = 'var(--ks-kinpaku-deep)';
const PATINA = 'var(--ks-patina)';
const GRAPHITE = 'var(--ks-graphite-2)';
const FAINT = 'var(--ks-text-faint)';

/* Кольцо прогресса */
export function Ring({ value = 0, target = 1, label, unit, size = 132, color = GOLD }) {
  const pct = target > 0 ? Math.min(1.25, value / target) : 0;
  const shown = Math.min(1, pct);
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const over = pct > 1.0;
  return (
    <div className="ring-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GRAPHITE} strokeWidth="7" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={over ? 'var(--ks-vermilion)' : color}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${c * shown} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.7s var(--ks-ease)' }}
        />
        <text x="50%" y="46%" textAnchor="middle" fill="var(--ks-champagne)"
          fontFamily="var(--ks-font-display)" fontWeight="600" fontSize={size / 4.4}>
          {Math.round(value)}
        </text>
        <text x="50%" y="62%" textAnchor="middle" fill={FAINT}
          fontFamily="var(--ks-font-mono)" fontSize={size / 11}>
          / {Math.round(target)} {unit}
        </text>
      </svg>
      <div className="ring-caption ks-mono">{label}</div>
    </div>
  );
}

/* Бары за неделю с линией цели */
export function WeekBars({ days, target, height = 170 }) {
  // days: [{ label, value }]
  const w = 560;
  const pad = { l: 8, r: 8, t: 18, b: 26 };
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(target * 1.25, ...days.map(d => d.value), 1);
  const bw = innerW / days.length;
  const y = v => pad.t + innerH * (1 - v / max);
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${w} ${height}`}>
        {target > 0 && (
          <>
            <line x1={pad.l} x2={w - pad.r} y1={y(target)} y2={y(target)}
              stroke="var(--ks-rule-strong)" strokeDasharray="5 5" strokeWidth="1" />
            <text x={w - pad.r} y={y(target) - 5} textAnchor="end" fill={FAINT}
              fontFamily="var(--ks-font-mono)" fontSize="10">цель</text>
          </>
        )}
        {days.map((d, i) => {
          const over = target > 0 && d.value > target * 1.1;
          const h = Math.max(2, innerH * (d.value / max));
          return (
            <g key={i}>
              <rect
                x={pad.l + i * bw + bw * 0.22} width={bw * 0.56}
                y={height - pad.b - h} height={h} rx="2"
                fill={d.value === 0 ? GRAPHITE : over ? 'var(--ks-vermilion)' : GOLD}
                opacity={d.value === 0 ? 0.6 : 0.92}
              />
              <text x={pad.l + i * bw + bw / 2} y={height - 8} textAnchor="middle"
                fill={FAINT} fontFamily="var(--ks-font-mono)" fontSize="10">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Остров: лаконичная геометрия — плита-остров на лаковом море */
export const ISLAND_META = {
  food: { 
    title: 'Остров Питания', 
    glyph: 'M-22 6 L0 -16 L22 6 Z',
    unlock: '7 дней подряд записывать еду',
    reward: 'Доступ к рецептам от бота',
    desc: 'Олицетворяет ваши отношения с едой. Строится при регулярном ведении дневника.'
  },
  movement: { 
    title: 'Остров Движения', 
    glyph: 'M-22 8 C-10 -14, 10 -14, 22 8',
    unlock: '10 микро-тренировок',
    reward: 'Персональные планы на 5 минут',
    desc: 'Ваша физическая активность. Гнев дает энергию для тренировок и прогулок.'
  },
  hydration: { 
    title: 'Остров Воды', 
    glyph: 'M0 -16 C12 0, 10 10, 0 10 C-10 10, -12 0, 0 -16 Z',
    unlock: '7 дней водного баланса',
    reward: 'Увеличение уровня Радости',
    desc: 'Чистота и гидратация вашего тела. Помогает держать уровень Радости высоким.'
  },
  honesty: { 
    title: 'Остров Честности', 
    glyph: 'M-16 -10 L16 -10 L16 10 L-16 10 Z',
    unlock: '5 честных срывов без оправданий',
    reward: 'Доступ к глубокой аналитике',
    desc: 'Самый сложный остров. Печаль растет, когда вы честно признаете свои слабости.'
  },
  balance: { 
    title: 'Остров Баланса', 
    glyph: 'M-20 0 L0 -12 L20 0 L0 12 Z',
    unlock: 'Все эмоции на уровне 50+',
    reward: 'Титул «Дирижёр пульта»',
    desc: 'Гармония вашего внутреннего мира. Требует сбалансированности всех 5 эмоций.'
  },
  sleep: { 
    title: 'Остров Сна', 
    glyph: 'M-14 -10 L14 -10 L-14 10 L14 10',
    unlock: '14 дней отметок самочувствия',
    reward: 'Советы по режиму сна',
    desc: 'Остров спокойствия и восстановления. Контролируется вашим Страхом.'
  },
};

const STATUS_RU = {
  locked: 'не открыт', growing: 'растёт', active: 'активен',
  crumbling: 'в тумане', restoring: 'восстанавливается', destroyed: 'затонул',
};

function islandColors(status) {
  switch (status) {
    case 'active':     return { land: GOLD, edge: GOLD_DEEP, dim: 1 };
    case 'growing':    return { land: PATINA, edge: 'var(--ks-patina-deep)', dim: 1 };
    case 'restoring':  return { land: PATINA, edge: 'var(--ks-patina-deep)', dim: 0.8 };
    case 'crumbling':  return { land: FAINT, edge: GRAPHITE, dim: 0.6 };
    case 'destroyed':  return { land: GRAPHITE, edge: GRAPHITE, dim: 0.5 };
    default:           return { land: GRAPHITE, edge: GRAPHITE, dim: 0.7 };
  }
}

export function IslandTile({ island }) {
  const meta = ISLAND_META[island.island_code] || { title: island.island_code, glyph: 'M-14 0 L14 0' };
  const col = islandColors(island.status);
  const val = island.status === 'growing' || island.status === 'locked'
    ? Number(island.progress) || 0
    : Number(island.health) || 0;
  const valLabel = island.status === 'growing' || island.status === 'locked' ? 'прогресс' : 'здоровье';
  const barColor = island.status === 'active' ? GOLD : island.status === 'crumbling' ? 'var(--ks-vermilion)' : PATINA;
  return (
    <div className="ks-bento-tile island-tile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <svg viewBox="0 0 200 110">
          {/* море */}
          <rect x="0" y="0" width="200" height="110" fill="var(--ks-lacquer-deep)" />
          <line x1="0" y1="86" x2="200" y2="86" stroke="var(--ks-rule)" strokeWidth="1" />
          <line x1="0" y1="94" x2="200" y2="94" stroke="var(--ks-rule)" strokeWidth="0.5" />
          {/* плита острова */}
          <g opacity={col.dim}>
            <polygon points="40,86 70,52 130,52 160,86" fill={col.land} opacity="0.18" />
            <polygon points="40,86 70,52 130,52 160,86" fill="none" stroke={col.edge} strokeWidth="1.4" />
            {/* глиф */}
            <g transform="translate(100 38)">
              <path d={meta.glyph} fill="none" stroke={col.land} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            </g>
            {/* золотой шов при active */}
            {island.status === 'active' && (
              <line x1="40" y1="86" x2="160" y2="86" stroke={GOLD} strokeWidth="2" />
            )}
          </g>
        </svg>
        <h3 style={{ marginTop: 12, fontSize: '1.02rem' }}>{meta.title}</h3>
        <div className="island-meta">
          <span className="ks-mono">{STATUS_RU[island.status] || island.status}</span>
          <span className="ks-mono" style={{ color: 'var(--ks-text-muted)' }}>{valLabel} {Math.round(val)}%</span>
        </div>
        <div className="progress-rail">
          <div className="progress-fill" style={{ width: `${Math.min(100, val)}%`, background: barColor }} />
        </div>
      </div>
      {meta.unlock && (
        <div style={{ marginTop: 10, fontSize: '0.8rem', borderTop: '1px solid var(--ks-rule)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: 'var(--ks-text-faint)' }}>Цель:</span>
            <span style={{ color: 'var(--ks-champagne)', textAlign: 'right', marginLeft: 8 }}>{meta.unlock}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: 'var(--ks-text-faint)' }}>Награда:</span>
            <span style={{ color: 'var(--ks-patina)', textAlign: 'right', marginLeft: 8 }}>{meta.reward}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Пульт эмоций */
const EMOTIONS = [
  { key: 'joy', name: 'Радость', color: GOLD },
  { key: 'sadness', name: 'Печаль', color: PATINA },
  { key: 'anger', name: 'Гнев', color: 'var(--ks-vermilion)' },
  { key: 'fear', name: 'Страх', color: 'var(--ks-kinpaku-deep)' },
  { key: 'disgust', name: 'Брезгливость', color: 'var(--ks-patina-deep)' },
];

export function levelName(e) {
  const avg = Math.round((Number(e.joy || 0) + Number(e.sadness || 0) + Number(e.anger || 0) + Number(e.fear || 0) + Number(e.disgust || 0)) / 5);
  if (avg >= 80) return 'Дирижёр пульта';
  if (avg >= 60) return 'Слаженная команда';
  if (avg >= 40) return 'Дежурная эмоция';
  if (avg >= 20) return 'Первые кнопки';
  return 'Хаос на пульте';
}

export function EmotionConsole({ emotions }) {
  const e = emotions || {};
  return (
    <div>
      {EMOTIONS.map(({ key, name, color }) => {
        const v = Math.max(0, Math.min(100, Number(e[key]) || 0));
        return (
          <div className="emotion-row" key={key}>
            <span className="emotion-name">{name}</span>
            <div className="progress-rail" style={{ marginTop: 0 }}>
              <div className="progress-fill" style={{ width: `${v}%`, background: color }} />
            </div>
            <span className="emotion-val">{v}</span>
          </div>
        );
      })}
    </div>
  );
}
