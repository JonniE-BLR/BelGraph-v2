import React, { useMemo, useRef } from 'react';
import { Calendar, MapPin, Network, Quote } from 'lucide-react';
import { CATEGORIES, CATEGORY_HEX_MAP, PEOPLE } from '../data/people';
import { PORTRAITS } from '../data/portraits';
import { CategoryId, Language, Person } from '../types/person';

interface ChronicleViewProps {
  lang: Language;
  activeCategory: CategoryId | 'all';
  searchQuery: string;
  yearRange: [number, number];
  selectedPersonId: string | null;
  activePath: string[];
  onSelectPerson: (id: string) => void;
}

interface EraGroup {
  id: string;
  titleBe: string;
  titleRu: string;
  subtitleBe: string;
  subtitleRu: string;
  minYear: number;
  maxYear: number;
}

const ERAS: EraGroup[] = [
  {
    id: 'medieval',
    titleBe: 'XII ст. — Духоўныя вытокі Полацка і Турава',
    titleRu: 'XII век — Духовные истоки Полоцка и Турова',
    subtitleBe: 'Першыя школы, скрыпторыі, фрэскі і філасофскае красамоўства',
    subtitleRu: 'Первые просветительские школы, книгописные мастерские и высокая словесность',
    minYear: 1000,
    maxYear: 1400
  },
  {
    id: 'renaissance',
    titleBe: 'XV–XVI стст. — Залаты век Адраджэння і першадрукарства',
    titleRu: 'XV–XVI века — Золотой век Возрождения и книгопечатания',
    subtitleBe: 'Біблія Скарыны, лацінская паэзія Гусоўскага і Статут 1588 года',
    subtitleRu: 'Пражская Библия Скорины, ренессансная поэзия и правовое государство Льва Сапеги',
    minYear: 1401,
    maxYear: 1570
  },
  {
    id: 'baroque-enlightenment',
    titleBe: 'XVII–XVIII стст. — Навука барока, ракеты Семяновіча і Асветніцтва',
    titleRu: 'XVII–XVIII века — Грамматика, ракетостроение и эпоха Просвещения',
    subtitleBe: 'Славянская граматыка, першыя ў свеце чарцяжы шматступеньчатых ракет і паўстанне Касцюшкі',
    subtitleRu: 'Европейские академии, чертежи многоступенчатых ракет 1650 года и идеалы свободы',
    minYear: 1571,
    maxYear: 1790
  },
  {
    id: 'nineteenth',
    titleBe: 'XIX ст. — Рамантызм, сусветная навука і пачатак новага Адраджэння',
    titleRu: 'XIX век — Романтизм, мировая наука и национальное Возрождение',
    subtitleBe: 'Ад філаматаў і чылійскіх Анд Ігната Дамейкі да Соф’і Кавалеўскай, Наркевіча-Ёдкі і Багушэвіча',
    subtitleRu: 'От поэзии Мицкевича и геологии Домейко до открытий Наркевича-Иодко и завета Богушевича',
    minYear: 1791,
    maxYear: 1875
  },
  {
    id: 'early-twentieth',
    titleBe: 'Кан. XIX — першая палова XX ст. — Класікі слова, сусветны авангард і авіяцыя',
    titleRu: 'Кон. XIX — первая половина XX в. — Классики, авангард и наука XX века',
    subtitleBe: 'Купала, Колас, Багдановіч, Віцебская школа Шагала, псіхалогія Выгоцкага і самалёты Сухога',
    subtitleRu: 'Купала, Колас, Богданович, Витебский авангард Шагала, Лев Выготский и авиация Сухого',
    minYear: 1876,
    maxYear: 1915
  },
  {
    id: 'mid-late-twentieth',
    titleBe: 'ХХ ст. — Эпас, касмічная эра і Нобелеўскія вяршыні',
    titleRu: 'XX век — Великая проза, освоение космоса и Нобелевские открытия',
    subtitleBe: 'Быкаў, Караткевіч, Савіцкі, «Песняры», гетэраструктуры Алфёрава, Клімук, Кавалёнак і Корбут',
    subtitleRu: 'Быков, Короткевич, «Песняры», физика Алфёрова, Нобель Алексиевич и рекорды Ольги Корбут',
    minYear: 1916,
    maxYear: 1959
  },
  {
    id: 'modern-era',
    titleBe: 'Сучасная эпоха — Глабальнае IT, МКС і сусветны спартыўны Алімп',
    titleRu: 'Современная эпоха — Глобальное IT, полёты на МКС и чемпионы мира',
    subtitleBe: 'EPAM і AI-праекты, палёты Навіцкага і Марыны Васілеўскай, трыумфы Домрачавай, Азаранкі і Сабаленкі',
    subtitleRu: 'Инженерия EPAM и AI-стартапов, экспедиция Марины Василевской на МКС и первые ракетки мира',
    minYear: 1960,
    maxYear: 2030
  }
];

export const ChronicleView: React.FC<ChronicleViewProps> = ({
  lang,
  activeCategory,
  searchQuery,
  yearRange,
  selectedPersonId,
  activePath,
  onSelectPerson
}) => {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const q = searchQuery.trim().toLowerCase();
  const pathSet = useMemo(() => new Set(activePath), [activePath]);

  const sortedFiltered = useMemo(() => {
    return PEOPLE.filter((p) => {
      const catOk = activeCategory === 'all' || p.category === activeCategory;
      const yearOk = p.birthYear >= yearRange[0] && p.birthYear <= yearRange[1];
      const searchOk =
        !q ||
        p.nameBe.toLowerCase().includes(q) ||
        p.nameRu.toLowerCase().includes(q) ||
        p.roleBe.toLowerCase().includes(q) ||
        p.roleRu.toLowerCase().includes(q) ||
        p.placeBe.toLowerCase().includes(q) ||
        p.placeRu.toLowerCase().includes(q);
      return catOk && yearOk && searchOk;
    }).sort((a, b) => a.birthYear - b.birthYear);
  }, [activeCategory, q, yearRange]);

  const groupedEras = useMemo(() => {
    return ERAS.map((era) => ({
      era,
      items: sortedFiltered.filter(
        (p) => p.birthYear >= era.minYear && p.birthYear <= era.maxYear
      )
    })).filter((g) => g.items.length > 0);
  }, [sortedFiltered]);

  const scrollToEra = (eraId: string) => {
    sectionRefs.current[eraId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Quick Era Jump Ribbon */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto px-4 sm:px-6 py-2.5 border-b shrink-0"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1" style={{ color: 'var(--ink-soft)' }}>
          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          {lang === 'be' ? 'Эпохі:' : 'Эпохи:'}
        </span>
        {groupedEras.map(({ era, items }) => (
          <button
            key={era.id}
            type="button"
            onClick={() => scrollToEra(era.id)}
            className="px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition cursor-pointer hover:opacity-90"
            style={{
              background: 'var(--bg-paper)',
              border: '1px solid var(--line)',
              color: 'var(--ink)'
            }}
          >
            {(lang === 'be' ? era.titleBe : era.titleRu).split('—')[0].trim()}{' '}
            <span style={{ color: 'var(--accent)' }}>({items.length})</span>
          </button>
        ))}
      </div>

      {/* Scrollable Vertical Illustrated Timeline Spine */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-10">
        {groupedEras.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--ink-soft)' }}>
            {lang === 'be'
              ? 'Няма асоб, якія адпавядаюць выбраным фільтрам.'
              : 'Нет личностей, соответствующих выбранным фильтрам.'}
          </div>
        ) : (
          groupedEras.map(({ era, items }) => (
            <section
              key={era.id}
              ref={(el) => {
                sectionRefs.current[era.id] = el as HTMLDivElement | null;
              }}
              className="relative"
            >
              {/* Era Banner */}
              <div
                className="rounded-xl p-4 mb-5 border-l-4"
                style={{
                  background: 'var(--bg-paper)',
                  borderColor: 'var(--line)',
                  borderLeftColor: 'var(--accent)'
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif-display text-lg sm:text-xl font-bold" style={{ color: 'var(--ink)' }}>
                    {lang === 'be' ? era.titleBe : era.titleRu}
                  </h3>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(139, 30, 43, 0.12)', color: 'var(--accent)' }}
                  >
                    {items.length} {lang === 'be' ? 'асоб' : 'личностей'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
                  {lang === 'be' ? era.subtitleBe : era.subtitleRu}
                </p>
              </div>

              {/* Cards along vertical chronological spine */}
              <div
                className="relative pl-6 sm:pl-9 space-y-4 before:content-[''] before:absolute before:left-2.5 sm:before:left-4 before:top-2 before:bottom-2 before:w-[2px]"
                style={{
                  // subtle vertical spine
                  borderColor: 'var(--line)'
                }}
              >
                <div
                  className="pointer-events-none"
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'linear-gradient(180deg, var(--accent), var(--gold), var(--line))'
                  }}
                />

                {items.map((person: Person) => {
                  const isSelected = selectedPersonId === person.id;
                  const inPath = pathSet.has(person.id);
                  const catMeta = CATEGORIES.find((c) => c.id === person.category)!;
                  const catHex = CATEGORY_HEX_MAP[person.category];

                  return (
                    <div
                      key={person.id}
                      onClick={() => onSelectPerson(person.id)}
                      className="relative rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group hover:-translate-y-0.5"
                      style={{
                        background: 'var(--bg-card)',
                        border: isSelected
                          ? '2px solid var(--accent)'
                          : inPath
                            ? '2px solid var(--gold)'
                            : '1px solid var(--line)',
                        boxShadow: isSelected ? 'var(--shadow)' : 'none'
                      }}
                    >
                      {/* Year Spine Node Dot */}
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2"
                        style={{
                          position: 'absolute',
                          left: '-29px',
                          top: '24px',
                          background: catHex,
                          borderColor: 'var(--bg)'
                        }}
                      />

                      <div className="flex items-start gap-3.5 sm:gap-4">
                        {/* Real Portrait Avatar */}
                        <div className="relative shrink-0">
                          <img
                            src={PORTRAITS[person.id]}
                            alt={lang === 'be' ? person.nameBe : person.nameRu}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm"
                            style={{ border: `3px solid ${catHex}` }}
                          />
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow"
                            style={{
                              position: 'absolute',
                              bottom: '-4px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: catHex,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {person.birthYear}
                          </span>
                        </div>

                        {/* Card Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span
                              className="text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                              style={{ background: catHex }}
                            >
                              {lang === 'be' ? catMeta.labelBe : catMeta.labelRu}
                            </span>
                            <span className="text-xs italic" style={{ color: 'var(--ink-soft)' }}>
                              {person.years}
                            </span>
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-soft)' }}>
                              <MapPin className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                              {lang === 'be' ? person.placeBe : person.placeRu}
                            </span>
                          </div>

                          <h4
                            className="font-serif-display text-lg font-bold group-hover:underline"
                            style={{ color: 'var(--ink)' }}
                          >
                            {lang === 'be' ? person.nameBe : person.nameRu}
                          </h4>

                          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
                            {lang === 'be' ? person.roleBe : person.roleRu}
                          </div>

                          <p className="text-xs sm:text-sm line-clamp-2 mb-2" style={{ color: 'var(--ink)' }}>
                            {lang === 'be' ? person.bioBe : person.bioRu}
                          </p>

                          <div
                            className="flex items-start gap-1.5 text-xs italic rounded-lg px-2.5 py-1.5"
                            style={{ background: 'var(--bg-paper)', color: 'var(--ink-soft)' }}
                          >
                            <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                            <span className="line-clamp-1">
                              «{lang === 'be' ? person.quoteBe : person.quoteRu}»
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                            <span className="flex items-center gap-1 font-medium">
                              <Network className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                              {lang === 'be'
                                ? `${person.connections.length} сувязяў у сетцы пакаленняў`
                                : `${person.connections.length} связей в сети поколений`}
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                              {lang === 'be' ? 'Адкрыць дасье →' : 'Открыть досье →'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
