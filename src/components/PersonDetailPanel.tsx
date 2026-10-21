import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Clock,
  GitBranch,
  MapPin,
  Quote,
  Route,
  Sparkles,
  X
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_HEX_MAP,
  GRAPH_LINKS,
  LINEAGE_PRESETS,
  PEOPLE,
  PEOPLE_MAP
} from '../data/people';
import { PORTRAITS, PORTRAIT_HI_RES } from '../data/portraits';
import { Language } from '../types/person';

interface PersonDetailPanelProps {
  personId: string | null;
  lang: Language;
  activePath: string[];
  onSelectPerson: (id: string, flyCamera?: boolean) => void;
  onClosePerson: () => void;
  onSelectPresetPath: (path: string[]) => void;
  onStartCustomPathFrom: (personId: string) => void;
}

export const PersonDetailPanel: React.FC<PersonDetailPanelProps> = ({
  personId,
  lang,
  activePath,
  onSelectPerson,
  onClosePerson,
  onSelectPresetPath,
  onStartCustomPathFrom
}) => {
  const person = personId ? PEOPLE_MAP[personId] : null;
  const [imgSrc, setImgSrc] = useState<string>('');

  // Instant crisp guaranteed WebP portrait + progressive upgrade to high-res Commons photo
  useEffect(() => {
    if (!person) return;
    const guaranteed = PORTRAITS[person.id];
    setImgSrc(guaranteed);

    const hiResUrl = PORTRAIT_HI_RES[person.id];
    if (hiResUrl) {
      let cancelled = false;
      const probe = new Image();
      probe.onload = () => {
        if (!cancelled) setImgSrc(hiResUrl);
      };
      probe.onerror = () => {
        if (!cancelled) setImgSrc(guaranteed);
      };
      probe.src = hiResUrl;
      return () => {
        cancelled = true;
      };
    }
  }, [person]);

  // Global Atlas Overview when no single node is selected
  if (!person) {
    return (
      <div className="p-5 sm:p-6 space-y-6 animate-panel-reveal">
        <div className="text-center pt-1">
          <div className="text-3xl mb-1" style={{ color: 'var(--accent)' }}>
            ❦
          </div>
          <h2 className="font-serif-display text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>
            {lang === 'be' ? 'Атлас пакаленняў Беларусі' : 'Атлас поколений Беларуси'}
          </h2>
          <p className="text-xs sm:text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {lang === 'be'
              ? 'Націсніце на любы партрэт на графе або абярыце гатовы гістарычны маршрут ніжэй, каб убачыць жывую пераемнасць ідэй ад XII да XXI стагоддзя.'
              : 'Нажмите на любой портрет на графе или выберите готовый маршрут преемственности ниже, чтобы проследить связь поколений с XII по XXI век.'}
          </p>
        </div>

        {/* Key Dataset Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div
            className="rounded-xl p-3 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
          >
            <div className="font-serif-display text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>
              {PEOPLE.length}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'be' ? 'Асоб у графе' : 'Личностей'}
            </div>
          </div>
          <div
            className="rounded-xl p-3 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
          >
            <div className="font-serif-display text-2xl font-extrabold" style={{ color: 'var(--gold)' }}>
              {GRAPH_LINKS.length}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'be' ? 'Нітак уплыву' : 'Нитей связей'}
            </div>
          </div>
          <div
            className="rounded-xl p-3 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
          >
            <div className="font-serif-display text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>
              920+
            </div>
            <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'be' ? 'Гадоў прагрэсу' : 'Лет прогресса'}
            </div>
          </div>
        </div>

        {/* Quick Jump to Central Hub Skaryna */}
        <button
          type="button"
          onClick={() => onSelectPerson('skorina', true)}
          className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition hover:shadow-md cursor-pointer"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--gold)'
          }}
        >
          <img
            src={PORTRAITS['skorina']}
            alt="Францыск Скарына"
            className="w-14 h-14 rounded-full object-cover shrink-0"
            style={{ border: '2.5px solid var(--accent)' }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {lang === 'be' ? 'Цэнтральны вузел графа' : 'Центральное ядро графа'}
            </div>
            <div className="font-serif-display text-base font-bold" style={{ color: 'var(--ink)' }}>
              {lang === 'be' ? 'Францыск Скарына (1486–1551)' : 'Франциск Скорина (1486–1551)'}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'be' ? 'Адкрыць сувязі першадрукара →' : 'Раскрыть связи первопечатника →'}
            </div>
          </div>
        </button>

        {/* Curated Lineage Journeys */}
        <div>
          <h3
            className="font-serif-display text-base font-bold pb-1.5 mb-3 border-b flex items-center gap-1.5"
            style={{ color: 'var(--accent)', borderColor: 'var(--line)' }}
          >
            <Sparkles className="w-4 h-4" />
            {lang === 'be' ? 'Маршруты пераемнасці пакаленняў' : 'Маршруты преемственности поколений'}
          </h3>
          <div className="space-y-2.5">
            {LINEAGE_PRESETS.map((preset) => {
              const isCurrent =
                activePath.length === preset.path.length &&
                activePath.every((v, i) => v === preset.path[i]);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPresetPath(preset.path)}
                  className="w-full text-left p-3 rounded-xl border transition hover:shadow-sm cursor-pointer"
                  style={{
                    background: isCurrent ? 'rgba(184, 146, 58, 0.16)' : 'var(--bg-card)',
                    borderColor: isCurrent ? 'var(--gold)' : 'var(--line)'
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                      {lang === 'be' ? preset.titleBe : preset.titleRu}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'var(--bg-paper)', color: 'var(--accent)' }}
                    >
                      {preset.path.length} {lang === 'be' ? 'крокаў' : 'звеньев'}
                    </span>
                  </div>
                  <p className="text-[11.5px] mt-1 leading-snug" style={{ color: 'var(--ink-soft)' }}>
                    {lang === 'be' ? preset.descBe : preset.descRu}
                  </p>
                  <div className="flex items-center -space-x-1.5 mt-2">
                    {preset.path.map((pid) => (
                      <img
                        key={pid}
                        src={PORTRAITS[pid]}
                        alt={PEOPLE_MAP[pid]?.nameBe}
                        className="w-6 h-6 rounded-full object-cover ring-2"
                        style={{ '--tw-ring-color': 'var(--bg)' } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const catMeta = CATEGORIES.find((c) => c.id === person.category)!;
  const catHex = CATEGORY_HEX_MAP[person.category];

  const connectedPeople = person.connections
    .map((cid) => PEOPLE_MAP[cid])
    .filter(Boolean)
    .sort((a, b) => a.birthYear - b.birthYear);

  const predecessors = connectedPeople.filter((p) => p.birthYear <= person.birthYear);
  const successors = connectedPeople.filter((p) => p.birthYear > person.birthYear);

  return (
    <div key={person.id} className="p-5 sm:p-6 animate-panel-reveal">
      {/* Top Bar: Category Pill + Close to Atlas Overview */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs"
          style={{ background: catHex }}
        >
          {lang === 'be' ? catMeta.labelBe : catMeta.labelRu}
        </span>

        <button
          type="button"
          onClick={onClosePerson}
          title={lang === 'be' ? 'Да агляду ўсёй сеткі' : 'К общему обзору атласа'}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition hover:opacity-80 cursor-pointer"
          style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)', background: 'var(--bg-card)' }}
        >
          <span>{lang === 'be' ? 'Атлас' : 'Обзор'}</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Portrait & Header Identity */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative shrink-0">
          <div
            className="w-24 h-24 sm:w-26 sm:h-26 rounded-full p-1 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${catHex}, var(--gold))`
            }}
          >
            <img
              src={imgSrc || PORTRAITS[person.id]}
              onError={() => setImgSrc(PORTRAITS[person.id])}
              alt={lang === 'be' ? person.nameBe : person.nameRu}
              className="w-full h-full rounded-full object-cover bg-stone-200"
            />
          </div>
          {person.isCentralHub && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold shadow"
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--gold)',
                color: '#2b2620',
                whiteSpace: 'nowrap'
              }}
            >
              ❦ Цэнтр
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className="font-serif-display text-2xl font-extrabold leading-tight"
            style={{ color: 'var(--ink)' }}
          >
            {lang === 'be' ? person.nameBe : person.nameRu}
          </h2>
          <div className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
            {lang === 'be' ? person.roleBe : person.roleRu}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1.5" style={{ color: 'var(--ink-soft)' }}>
            <span className="italic font-medium">{person.years}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--gold)' }} />
              {lang === 'be' ? person.placeBe : person.placeRu}
            </span>
          </div>
        </div>
      </div>

      {/* Action: Trace Generational Path From This Figure */}
      <button
        type="button"
        onClick={() => onStartCustomPathFrom(person.id)}
        className="w-full mb-4 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition hover:shadow-xs cursor-pointer"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--line)',
          color: 'var(--ink)'
        }}
      >
        <Route className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        <span>
          {lang === 'be'
            ? 'Пракласці ланцужок пакаленняў ад гэтай асобы'
            : 'Проложить цепочку поколений от этой личности'}
        </span>
      </button>

      {/* Authentic Quote Block */}
      <blockquote
        className="relative rounded-xl p-3.5 mb-5 border-l-4"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--line)',
          borderLeftColor: 'var(--gold)'
        }}
      >
        <div className="flex items-start gap-2">
          <Quote className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
          <p className="text-xs sm:text-[13.5px] italic leading-relaxed" style={{ color: 'var(--ink)' }}>
            «{lang === 'be' ? person.quoteBe : person.quoteRu}»
          </p>
        </div>
      </blockquote>

      {/* Biography */}
      <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--ink)' }}>
        {lang === 'be' ? person.bioBe : person.bioRu}
      </p>

      {/* Key Achievements */}
      <div className="mb-5">
        <h3
          className="font-serif-display text-base font-bold pb-1.5 mb-2.5 border-b flex items-center gap-1.5"
          style={{ color: 'var(--accent)', borderColor: 'var(--line)' }}
        >
          <Award className="w-4 h-4" />
          {lang === 'be' ? 'Ключавыя дасягненні і ўклад' : 'Ключевые достижения и вклад'}
        </h3>
        <ul className="space-y-2">
          {(lang === 'be' ? person.achievementsBe : person.achievementsRu).map((ach, idx) => (
            <li
              key={idx}
              className="text-xs sm:text-[13.5px] leading-snug pl-4 relative"
              style={{ color: 'var(--ink)' }}
            >
              <span
                className="text-[10px]"
                style={{ position: 'absolute', left: 0, top: '2px', color: 'var(--accent)' }}
              >
                ◆
              </span>
              {ach}
            </li>
          ))}
        </ul>
      </div>

      {/* Personal Chronological Timeline ("Временная шкала жизни") */}
      <div className="mb-5">
        <h3
          className="font-serif-display text-base font-bold pb-1.5 mb-3 border-b flex items-center gap-1.5"
          style={{ color: 'var(--accent)', borderColor: 'var(--line)' }}
        >
          <Clock className="w-4 h-4" />
          {lang === 'be' ? 'Шкала жыцця і здзяйсненняў' : 'Временная шкала жизни и открытий'}
        </h3>
        <div className="relative pl-5 space-y-3">
          <div
            style={{
              position: 'absolute',
              left: '6px',
              top: '6px',
              bottom: '6px',
              width: '2px',
              background: 'linear-gradient(180deg, var(--accent), var(--gold))'
            }}
          />
          {person.milestones.map((m, idx) => (
            <div key={idx} className="relative text-xs sm:text-[13px] leading-snug">
              <span
                className="w-2.5 h-2.5 rounded-full border"
                style={{
                  position: 'absolute',
                  left: '-18px',
                  top: '4px',
                  background: 'var(--gold)',
                  borderColor: 'var(--bg)'
                }}
              />
              <span className="font-bold mr-1.5" style={{ color: 'var(--accent)' }}>
                {m.year} —
              </span>
              <span style={{ color: 'var(--ink)' }}>
                {lang === 'be' ? m.labelBe : m.labelRu}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bidirectional Generational Connections with Mini Portraits */}
      <div className="space-y-4">
        <h3
          className="font-serif-display text-base font-bold pb-1.5 border-b flex items-center justify-between"
          style={{ color: 'var(--accent)', borderColor: 'var(--line)' }}
        >
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4" />
            {lang === 'be' ? 'Сувязі ў сетцы пакаленняў' : 'Связи в сети поколений'}
          </span>
          <span className="text-xs font-sans font-semibold" style={{ color: 'var(--ink-soft)' }}>
            {connectedPeople.length}
          </span>
        </h3>

        {predecessors.length > 0 && (
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--ink-soft)' }}
            >
              {lang === 'be'
                ? 'Вытокі, настаўнікі і сучаснікі'
                : 'Предшественники и современники'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {predecessors.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => onSelectPerson(cp.id, true)}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium border transition hover:shadow-xs cursor-pointer group"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)'
                  }}
                >
                  <img
                    src={PORTRAITS[cp.id]}
                    alt={cp.nameBe}
                    className="w-5 h-5 rounded-full object-cover"
                    style={{ border: `1.5px solid ${CATEGORY_HEX_MAP[cp.category]}` }}
                  />
                  <span>{lang === 'be' ? cp.nameBe : cp.nameRu}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}

        {successors.length > 0 && (
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--ink-soft)' }}
            >
              {lang === 'be'
                ? 'Працягвальнікі і наступныя пакаленні'
                : 'Продолжатели и следующие поколения'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {successors.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => onSelectPerson(cp.id, true)}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium border transition hover:shadow-xs cursor-pointer group"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)'
                  }}
                >
                  <img
                    src={PORTRAITS[cp.id]}
                    alt={cp.nameBe}
                    className="w-5 h-5 rounded-full object-cover"
                    style={{ border: `1.5px solid ${CATEGORY_HEX_MAP[cp.category]}` }}
                  />
                  <span>{lang === 'be' ? cp.nameBe : cp.nameRu}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
