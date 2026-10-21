import { CategoryId, CategoryMeta, LineagePreset, Person } from '../types/person';
import { PEOPLE_PART_1 } from './peoplePart1';
import { PEOPLE_PART_2 } from './peoplePart2';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'all', labelBe: 'Усе пакаленні', labelRu: 'Все поколения', colorVar: 'var(--ink)', hex: '#2b2620' },
  { id: 'enlightener', labelBe: 'Асветнікі', labelRu: 'Просветители', colorVar: 'var(--cat-enlightener)', hex: '#8b1e2b' },
  { id: 'writer', labelBe: 'Пісьменнікі', labelRu: 'Писатели и поэты', colorVar: 'var(--cat-writer)', hex: '#2d5a3d' },
  { id: 'figure', labelBe: 'Дзеячы', labelRu: 'Гос. и общ. деятели', colorVar: 'var(--cat-figure)', hex: '#3d4a7a' },
  { id: 'scientist', labelBe: 'Вучоныя і космас', labelRu: 'Учёные и космос', colorVar: 'var(--cat-scientist)', hex: '#8c5319' },
  { id: 'artist', labelBe: 'Мастацтва і музыка', labelRu: 'Искусство и музыка', colorVar: 'var(--cat-artist)', hex: '#7a3d6b' },
  { id: 'modern', labelBe: 'IT і Спорт', labelRu: 'Современные IT и Спорт', colorVar: 'var(--cat-modern)', hex: '#0e6f73' }
];

export const CATEGORY_COLOR_MAP: Record<CategoryId, string> = {
  enlightener: 'var(--cat-enlightener)',
  writer: 'var(--cat-writer)',
  figure: 'var(--cat-figure)',
  scientist: 'var(--cat-scientist)',
  artist: 'var(--cat-artist)',
  modern: 'var(--cat-modern)'
};

export const CATEGORY_HEX_MAP: Record<CategoryId, string> = {
  enlightener: '#8b1e2b',
  writer: '#2d5a3d',
  figure: '#3d4a7a',
  scientist: '#8c5319',
  artist: '#7a3d6b',
  modern: '#0e6f73'
};

// Build symmetric bidirectional graph across all 62 historical & modern personalities
function buildSymmetricPeople(): Person[] {
  const combined = [...PEOPLE_PART_1, ...PEOPLE_PART_2];
  const map = new Map<string, Set<string>>();
  const validIds = new Set(combined.map(p => p.id));

  for (const p of combined) {
    if (!map.has(p.id)) map.set(p.id, new Set());
    for (const target of p.connections) {
      if (target !== p.id && validIds.has(target)) {
        map.get(p.id)!.add(target);
        if (!map.has(target)) map.set(target, new Set());
        map.get(target)!.add(p.id);
      }
    }
  }

  return combined.map(p => ({
    ...p,
    connections: Array.from(map.get(p.id) || [])
  }));
}

export const PEOPLE: Person[] = buildSymmetricPeople();

export const PEOPLE_MAP: Record<string, Person> = Object.fromEntries(
  PEOPLE.map(p => [p.id, p])
);

export interface GraphLink {
  key: string;
  source: string;
  target: string;
}

export const GRAPH_LINKS: GraphLink[] = (() => {
  const links: GraphLink[] = [];
  const seen = new Set<string>();
  for (const p of PEOPLE) {
    for (const target of p.connections) {
      const pairKey = p.id < target ? `${p.id}--${target}` : `${target}--${p.id}`;
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        // Order older -> newer so directional flow particles move from past to present!
        const pObj = PEOPLE_MAP[p.id];
        const tObj = PEOPLE_MAP[target];
        const [from, to] = pObj.birthYear <= tObj.birthYear ? [p.id, target] : [target, p.id];
        links.push({ key: pairKey, source: from, target: to });
      }
    }
  }
  return links;
})();

export const LINEAGE_PRESETS: LineagePreset[] = [
  {
    id: 'skorina-digital',
    titleBe: 'Ад Скарыны да лічбавай эпохі і AI',
    titleRu: 'От Скорины до цифровой эры и AI',
    descBe: 'Як кнігадрукаванне, філалогія і фізіка прывялі Беларусь да Нобеля па фізіцы і глабальных IT-кампаній',
    descRu: 'Преемственность книжной премудрости, университетской науки, физики гетероструктур и мировой IT-индустрии',
    path: ['skorina', 'smatrycki', 'polocki', 'domieika', 'narkiewicz', 'alferov', 'dobkin', 'gurski']
  },
  {
    id: 'space-odyssey',
    titleBe: 'Беларускі шлях у космас (1650–2024)',
    titleRu: 'Белорусский путь в космос (1650–2024)',
    descBe: 'Ад шматступеньчатых ракет Семяновіча і мрой Драздовіча да «Апалона» і палёту Марыны Васілеўскай на МКС',
    descRu: '375 лет космической мысли: от чертежей ракет Семеновича и топлива «Аполлона» до полёта Марины Василевской на МКС',
    path: ['siemienowicz', 'drazdovic', 'sukhoi', 'kit', 'klimuk', 'kavalionak', 'navicki', 'vasileuskaja']
  },
  {
    id: 'revival-nobel',
    titleBe: 'Код Адраджэння і Нобель па літаратуры',
    titleRu: 'Код Возрождения и Нобель по литературе',
    descBe: 'Жывая нітка беларускага гуманізму ад Скарыны і Багушэвіча да Купалы, Быкава і Святланы Алексіевіч',
    descRu: 'От первопечатного слова Скорины и завета Богушевича через Купалу и Быкова к Нобелевской премии Алексиевич',
    path: ['skorina', 'dunin', 'kalinouski', 'bahusevic', 'kupala', 'bykau', 'aleksievic']
  },
  {
    id: 'art-music',
    titleBe: 'Гармонія мастацтва: ад Агінскага да Шагала і «Песняроў»',
    titleRu: 'Гармония искусств: от Огинского до Шагала и «Песняров»',
    descBe: 'Еўрапейская музыка, жывапіс Віцебска і сусветнае гучанне беларускай паэзіі ў творчасці Уладзіміра Мулявіна',
    descRu: 'От полонеза Огинского и первой белорусской оперы Монюшко к авангарду Шагала и триумфу «Песняров»',
    path: ['ahinski', 'moniuszko', 'dunin', 'kupala', 'bahdanovic', 'shagal', 'baradulin', 'muliavin']
  },
  {
    id: 'olympic-champions',
    titleBe: 'Алімпійская слава і тэнісны Алімп',
    titleRu: 'Олимпийская слава и теннисный Олимп',
    descBe: 'Ад рэвалюцыйнай «Пятлі Корбут» у Мюнхене-1972 да алімпійскіх рэкордаў Домрачавай і № 1 у свеце Азаранкі і Сабаленкі',
    descRu: 'От феномена Ольги Корбут до олимпийских рекордов Дарьи Домрачевой и первых ракеток мира Азаренко и Соболенко',
    path: ['korbut', 'mirny', 'domracava', 'azaranka', 'sabalenka']
  }
];

// Breadth-First Search (BFS) shortest generational path between any two personalities
export function findShortestPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  if (!PEOPLE_MAP[startId] || !PEOPLE_MAP[endId]) return [];

  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const last = currentPath[currentPath.length - 1];
    const person = PEOPLE_MAP[last];
    if (!person) continue;

    for (const neighbor of person.connections) {
      if (neighbor === endId) {
        return [...currentPath, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...currentPath, neighbor]);
      }
    }
  }
  return [];
}

// Non-linear year mapping for crisp visual spacing from 1100 to 2026
export function yearToTimelineX(year: number): number {
  const anchors: [number, number][] = [
    [1100, 120],
    [1200, 210],
    [1470, 310],
    [1600, 520],
    [1750, 720],
    [1800, 860],
    [1850, 1130],
    [1880, 1340],
    [1900, 1590],
    [1925, 1850],
    [1950, 2110],
    [1980, 2360],
    [2005, 2580]
  ];

  if (year <= anchors[0][0]) return anchors[0][1];
  if (year >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

  for (let i = 0; i < anchors.length - 1; i++) {
    const [y0, x0] = anchors[i];
    const [y1, x1] = anchors[i + 1];
    if (year >= y0 && year <= y1) {
      const t = (year - y0) / (y1 - y0);
      return x0 + t * (x1 - x0);
    }
  }
  return 1200;
}

export const TIMELINE_TICKS: { year: number; labelBe: string; labelRu: string }[] = [
  { year: 1104, labelBe: 'XII ст. Полацк і Тураў', labelRu: 'XII в. Полоцк и Туров' },
  { year: 1517, labelBe: '1517 Эпоха Скарыны', labelRu: '1517 Эпоха Скорины' },
  { year: 1619, labelBe: 'XVII ст. Навука і Статут', labelRu: 'XVII в. Статут и Наука' },
  { year: 1794, labelBe: 'Кан. XVIII ст. Асветніцтва', labelRu: 'Кон. XVIII в. Просвещение' },
  { year: 1840, labelBe: 'XIX ст. Рамантызм', labelRu: 'XIX в. Романтизм' },
  { year: 1882, labelBe: 'Адраджэнне («Наша Ніва»)', labelRu: 'Возрождение («Наша Нива»)' },
  { year: 1924, labelBe: 'ХХ ст. Класікі і авангард', labelRu: 'XX в. Классики и наука' },
  { year: 1955, labelBe: 'Космас, фізіка і культура', labelRu: 'Космос, физика и культура' },
  { year: 1990, labelBe: 'XXI ст. IT, МКС і Чэмпіёны', labelRu: 'XXI в. IT, МКС и Чемпионы' }
];

// Force-directed network layout centered majestically around Francysk Skaryna (900, 620)
export function computeNetworkPositions(): Record<string, { x: number; y: number }> {
  const cx = 900;
  const cy = 620;

  // Preferred sector angles per category so related spheres form intuitive constellations
  const catBaseAngle: Record<CategoryId, number> = {
    enlightener: -Math.PI * 0.82,
    figure: -Math.PI * 0.45,
    artist: -Math.PI * 0.08,
    writer: Math.PI * 0.52,
    scientist: -Math.PI * 0.18 + Math.PI * 1.12,
    modern: Math.PI * 0.14
  };

  // Desired orbital radius based on historical distance from Skaryna
  const getTargetRadius = (p: Person): number => {
    if (p.isCentralHub) return 0;
    if (p.birthYear < 1660) return 215;
    if (p.birthYear < 1855) return 385;
    if (p.birthYear < 1920) return 545;
    if (p.birthYear < 1960) return 690;
    return 825;
  };

  interface SimNode {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    fixed: boolean;
    targetR: number;
  }

  // Group by category for clean deterministic initial seeding
  const catCounters: Record<string, number> = {};
  const nodes: SimNode[] = PEOPLE.map((p) => {
    if (p.isCentralHub) {
      return { id: p.id, x: cx, y: cy, vx: 0, vy: 0, fixed: true, targetR: 0 };
    }
    const idx = (catCounters[p.category] = (catCounters[p.category] || 0) + 1);
    const spread = ((idx % 7) - 3) * 0.19 + Math.sin(idx * 2.1) * 0.12;
    const angle = catBaseAngle[p.category] + spread;
    const r = getTargetRadius(p);
    return {
      id: p.id,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.86,
      vx: 0,
      vy: 0,
      fixed: false,
      targetR: r
    };
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Run 280 physics relaxation steps for organic, overlap-free Force-Directed layout
  for (let step = 0; step < 280; step++) {
    const alpha = 1 - step / 300;

    // 1. All-pairs Coulomb repulsion + hard minimum distance so labels never collide
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) {
          dx = 1;
          dy = 0.5;
          distSq = 1.25;
        }
        const dist = Math.sqrt(distSq);
        const minGap = 128;
        let force = (6800 / distSq) * alpha;
        if (dist < minGap) {
          force += (minGap - dist) * 0.42;
        }
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!a.fixed) {
          a.vx -= fx;
          a.vy -= fy;
        }
        if (!b.fixed) {
          b.vx += fx;
          b.vy += fy;
        }
      }
    }

    // 2. Hooke spring attraction along generational links
    for (const link of GRAPH_LINKS) {
      const a = nodeMap.get(link.source)!;
      const b = nodeMap.get(link.target)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ideal = a.fixed || b.fixed ? 215 : 195;
      const k = 0.022 * alpha;
      const f = (dist - ideal) * k;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      if (!a.fixed) {
        a.vx += fx;
        a.vy += fy;
      }
      if (!b.fixed) {
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // 3. Soft generational shell & sector gravity
    for (const n of nodes) {
      if (n.fixed) continue;
      const dx = n.x - cx;
      const dy = (n.y - cy) / 0.88;
      const r = Math.sqrt(dx * dx + dy * dy) || 1;
      const radialPull = (n.targetR - r) * 0.032 * alpha;
      n.vx += (dx / r) * radialPull;
      n.vy += (dy / r) * radialPull * 0.88;

      const p = PEOPLE_MAP[n.id];
      const prefAngle = catBaseAngle[p.category];
      const prefX = cx + Math.cos(prefAngle) * n.targetR;
      const prefY = cy + Math.sin(prefAngle) * n.targetR * 0.88;
      n.vx += (prefX - n.x) * 0.014 * alpha;
      n.vy += (prefY - n.y) * 0.014 * alpha;

      n.vx *= 0.72;
      n.vy *= 0.72;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return Object.fromEntries(nodes.map(n => [n.id, { x: Math.round(n.x), y: Math.round(n.y) }]));
}

export const TIMELINE_LANES: CategoryId[] = [
  'enlightener',
  'figure',
  'writer',
  'scientist',
  'artist',
  'modern'
];

export const TIMELINE_LANE_Y: Record<CategoryId, number> = {
  enlightener: 155,
  figure: 335,
  writer: 535,
  scientist: 745,
  artist: 935,
  modern: 1115
};

// Chronological swimlane coordinates with vertical micro-staggering so zero portraits collide
export function computeTimelinePositions(): Record<string, { x: number; y: number }> {
  const raw = PEOPLE.map(p => ({
    id: p.id,
    cat: p.category,
    x: yearToTimelineX(p.birthYear),
    y: TIMELINE_LANE_Y[p.category]
  }));

  // Separate close neighbors within each swimlane cleanly
  for (let pass = 0; pass < 80; pass++) {
    for (let i = 0; i < raw.length; i++) {
      for (let j = i + 1; j < raw.length; j++) {
        const a = raw[i];
        const b = raw[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const minGap = 98;
        if (dist < minGap) {
          if (Math.abs(dy) < 2) dy = (i % 2 === 0 ? 1 : -1) * 8;
          const push = (minGap - dist) * 0.45;
          const ux = dx / (Math.sqrt(dx * dx + dy * dy) || 1);
          const uy = dy / (Math.sqrt(dx * dx + dy * dy) || 1);
          a.x -= ux * push * 0.65;
          b.x += ux * push * 0.65;
          a.y -= uy * push * 0.85;
          b.y += uy * push * 0.85;
        }
      }
    }
    for (const n of raw) {
      const base = TIMELINE_LANE_Y[n.cat];
      n.y += (base - n.y) * 0.08;
      n.x = Math.max(95, Math.min(2660, n.x));
    }
  }

  return Object.fromEntries(raw.map(n => [n.id, { x: Math.round(n.x), y: Math.round(n.y) }]));
}
