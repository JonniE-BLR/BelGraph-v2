import React, { useMemo } from 'react';
import { ArrowRight, Route, Sparkles, X } from 'lucide-react';
import {
  CATEGORY_HEX_MAP,
  LINEAGE_PRESETS,
  PEOPLE,
  PEOPLE_MAP,
  findShortestPath
} from '../data/people';
import { PORTRAITS } from '../data/portraits';
import { Language } from '../types/person';

interface PathExplorerBarProps {
  lang: Language;
  isOpen: boolean;
  fromId: string;
  toId: string;
  activePath: string[];
  onChangeFrom: (id: string) => void;
  onChangeTo: (id: string) => void;
  onApplyPath: (path: string[]) => void;
  onClearPath: () => void;
  onCloseBar: () => void;
  onClickStepPerson: (id: string) => void;
}

export const PathExplorerBar: React.FC<PathExplorerBarProps> = ({
  lang,
  isOpen,
  fromId,
  toId,
  activePath,
  onChangeFrom,
  onChangeTo,
  onApplyPath,
  onClearPath,
  onCloseBar,
  onClickStepPerson
}) => {
  const sortedOptions = useMemo(
    () =>
      [...PEOPLE].sort((a, b) =>
        (lang === 'be' ? a.nameBe : a.nameRu).localeCompare(
          lang === 'be' ? b.nameBe : b.nameRu
        )
      ),
    [lang]
  );

  if (!isOpen && activePath.length === 0) return null;

  const handleComputeBFS = (nextFrom: string, nextTo: string) => {
    const result = findShortestPath(nextFrom, nextTo);
    onApplyPath(result);
  };

  return (
    <div
      className="border-b px-4 sm:px-8 py-2.5 z-20 relative"
      style={{
        background: 'var(--bg-paper)',
        borderColor: 'var(--line)'
      }}
    >
      {isOpen && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="text-xs font-bold flex items-center gap-1.5 mr-1"
            style={{ color: 'var(--accent)' }}
          >
            <Route className="w-3.5 h-3.5" />
            {lang === 'be' ? 'Сувязь праз стагоддзі:' : 'Мост поколений (BFS):'}
          </span>

          <select
            value={fromId}
            onChange={(e) => {
              onChangeFrom(e.target.value);
              handleComputeBFS(e.target.value, toId);
            }}
            className="text-xs rounded-full px-3 py-1.5 border outline-none max-w-[205px]"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--line)',
              color: 'var(--ink)'
            }}
          >
            {sortedOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'be' ? p.nameBe : p.nameRu} ({p.birthYear})
              </option>
            ))}
          </select>

          <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--gold)' }} />

          <select
            value={toId}
            onChange={(e) => {
              onChangeTo(e.target.value);
              handleComputeBFS(fromId, e.target.value);
            }}
            className="text-xs rounded-full px-3 py-1.5 border outline-none max-w-[205px]"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--line)',
              color: 'var(--ink)'
            }}
          >
            {sortedOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'be' ? p.nameBe : p.nameRu} ({p.birthYear})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleComputeBFS(fromId, toId)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition cursor-pointer"
            style={{ background: 'var(--accent)' }}
          >
            {lang === 'be' ? 'Знайсці ланцужок' : 'Найти связь'}
          </button>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1 flex-wrap ml-auto">
            {LINEAGE_PRESETS.slice(0, 3).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPath(preset.path)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition hover:opacity-85 cursor-pointer inline-flex items-center gap-1"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)'
                }}
              >
                <Sparkles className="w-3 h-3" style={{ color: 'var(--gold)' }} />
                <span className="truncate max-w-[175px]">
                  {lang === 'be' ? preset.titleBe : preset.titleRu}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={onCloseBar}
              className="p-1 rounded-full hover:opacity-75 cursor-pointer"
              style={{ color: 'var(--ink-soft)' }}
              title={lang === 'be' ? 'Схаваць панэль' : 'Скрыть панель'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Path Visual Portrait Chain */}
      {activePath.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span
            className="text-[11px] font-bold uppercase tracking-wider shrink-0 mr-1"
            style={{ color: 'var(--gold)' }}
          >
            {lang === 'be'
              ? `Шлях (${activePath.length} пакаленняў):`
              : `Цепочка (${activePath.length} поколений):`}
          </span>

          {activePath.map((pid, idx) => {
            const p = PEOPLE_MAP[pid];
            if (!p) return null;
            return (
              <React.Fragment key={pid}>
                <button
                  type="button"
                  onClick={() => onClickStepPerson(pid)}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 border transition hover:scale-[1.03] cursor-pointer"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--gold)',
                    color: 'var(--ink)'
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center"
                    style={{ background: 'var(--gold)', color: '#2b2620' }}
                  >
                    {idx + 1}
                  </span>
                  <img
                    src={PORTRAITS[p.id]}
                    alt={p.nameBe}
                    className="w-5 h-5 rounded-full object-cover"
                    style={{ border: `1.5px solid ${CATEGORY_HEX_MAP[p.category]}` }}
                  />
                  <span>{lang === 'be' ? p.nameBe : p.nameRu}</span>
                  <span className="text-[10px] opacity-70">{p.birthYear}</span>
                </button>
                {idx < activePath.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--gold)' }} />
                )}
              </React.Fragment>
            );
          })}

          <button
            type="button"
            onClick={onClearPath}
            className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 cursor-pointer hover:opacity-80"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--line)',
              color: 'var(--accent)'
            }}
          >
            {lang === 'be' ? 'Скінуць маршрут ×' : 'Сбросить маршрут ×'}
          </button>
        </div>
      )}
    </div>
  );
};
