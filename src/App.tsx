import { useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  Moon,
  Network,
  Route,
  Search,
  SlidersHorizontal,
  Sun,
  X
} from 'lucide-react';
import { ChronicleView } from './components/ChronicleView';
import { GraphCanvas } from './components/GraphCanvas';
import { PathExplorerBar } from './components/PathExplorerBar';
import { PersonDetailPanel } from './components/PersonDetailPanel';
import {
  CATEGORIES,
  CATEGORY_HEX_MAP,
  PEOPLE,
  findShortestPath
} from './data/people';
import { PORTRAITS } from './data/portraits';
import { CategoryId, Language, ViewMode } from './types/person';

export function App() {
  const [lang, setLang] = useState<Language>('be');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('network');

  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [yearRange, setYearRange] = useState<[number, number]>([1100, 2026]);

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>('skorina');
  const [focusOnlyConnections, setFocusOnlyConnections] = useState<boolean>(false);
  const [focusRequestCounter, setFocusRequestCounter] = useState<number>(0);

  // Generational Path Explorer state
  const [pathBarOpen, setPathBarOpen] = useState<boolean>(false);
  const [pathFromId, setPathFromId] = useState<string>('skorina');
  const [pathToId, setPathToId] = useState<string>('vasileuskaja');
  const [activePath, setActivePath] = useState<string[]>([]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PEOPLE.length };
    for (const p of PEOPLE) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, []);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return PEOPLE.filter(
      (p) =>
        p.nameBe.toLowerCase().includes(q) ||
        p.nameRu.toLowerCase().includes(q) ||
        p.roleBe.toLowerCase().includes(q) ||
        p.roleRu.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const handleSelectPerson = (id: string, flyCamera = false) => {
    setSelectedPersonId(id);
    if (flyCamera) {
      setFocusRequestCounter((c) => c + 1);
    }
  };

  const handleApplyPath = (path: string[]) => {
    setActivePath(path);
    if (path.length > 0) {
      setActiveCategory('all');
      setYearRange([1100, 2026]);
      setSelectedPersonId(path[path.length - 1]);
      setFocusRequestCounter((c) => c + 1);
    }
  };

  const handleStartCustomPathFrom = (personId: string) => {
    const defaultTarget = personId === 'vasileuskaja' ? 'skorina' : 'vasileuskaja';
    setPathFromId(personId);
    setPathToId(defaultTarget);
    setPathBarOpen(true);
    const computed = findShortestPath(personId, defaultTarget);
    handleApplyPath(computed);
  };

  return (
    <div className={darkMode ? 'dark-atlas min-h-screen flex flex-col' : 'min-h-screen flex flex-col'}>
      {/* Decorative Belarusian Woven Ornament Strip */}
      <div className="ornament-border w-full shrink-0 z-30 relative" />

      {/* Main Archival Header */}
      <header
        className="relative z-30 px-4 sm:px-8 pt-3.5 pb-3 border-b"
        style={{
          background: darkMode ? 'rgba(23, 21, 18, 0.9)' : 'rgba(244, 239, 228, 0.9)',
          borderColor: 'var(--line)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title */}
          <div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1
                className="font-serif-display font-extrabold tracking-tight text-2xl sm:text-3xl lg:text-[2.15rem] leading-none"
                style={{ color: 'var(--ink)' }}
              >
                {lang === 'be' ? (
                  <>
                    Сетка <span className="italic" style={{ color: 'var(--accent)' }}>пакаленняў</span>
                  </>
                ) : (
                  <>
                    Сеть <span className="italic" style={{ color: 'var(--accent)' }}>поколений</span>
                  </>
                )}
              </h1>
              <span
                className="hidden xl:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                style={{
                  borderColor: 'var(--gold)',
                  color: 'var(--accent)',
                  background: 'var(--bg-card)'
                }}
              >
                {PEOPLE.length} {lang === 'be' ? 'выдатныя асобы (XII–XXI стст.)' : 'выдающиеся личности (XII–XXI вв.)'}
              </span>
            </div>
            <p className="text-xs sm:text-[13.5px] mt-1 font-light" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'be'
                ? 'Інтэрактыўны атлас сувязяў выдатных беларусаў — ад Еўфрасінні і Скарыны да навукі, МКС і сусветнага IT'
                : 'Интерактивный граф преемственности белорусов — от Евфросинии и Скорины до космоса, науки и мирового IT'}
            </p>
          </div>

          {/* Right Controls: Mode Switcher + Search + Path + Lang/Theme */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3-Mode View Switcher */}
            <div
              className="inline-flex rounded-full p-0.5 border"
              style={{ background: 'var(--bg-paper)', borderColor: 'var(--line)' }}
            >
              <button
                type="button"
                onClick={() => setViewMode('network')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
                style={{
                  background: viewMode === 'network' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'network' ? '#ffffff' : 'var(--ink)'
                }}
              >
                <Network className="w-3.5 h-3.5" />
                <span>{lang === 'be' ? 'Граф' : 'Граф'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline-graph')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
                style={{
                  background: viewMode === 'timeline-graph' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'timeline-graph' ? '#ffffff' : 'var(--ink)'
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{lang === 'be' ? 'Таймлайн' : 'Таймлайн'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('chronicle')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
                style={{
                  background: viewMode === 'chronicle' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'chronicle' ? '#ffffff' : 'var(--ink)'
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lang === 'be' ? 'Хроніка' : 'Хроника'}</span>
              </button>
            </div>

            {/* Search Input with Instant Portrait Autocomplete */}
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 pointer-events-none"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-soft)'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'be' ? 'Пошук асобы ці горада...' : 'Поиск личности или сферы...'}
                className="pl-8 pr-7 py-1.5 rounded-full text-xs sm:text-sm border outline-none transition w-44 sm:w-56 focus:w-64"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer opacity-70 hover:opacity-100"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--ink-soft)'
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Portrait Dropdown */}
              {searchFocused && searchSuggestions.length > 0 && (
                <div
                  className="rounded-xl border overflow-hidden shadow-xl z-50"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    minWidth: '250px',
                    background: 'var(--bg-paper)',
                    borderColor: 'var(--line)'
                  }}
                >
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => {
                        handleSelectPerson(item.id, true);
                        setSearchQuery('');
                        setSearchFocused(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-black/5 transition cursor-pointer border-b last:border-b-0"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      <img
                        src={PORTRAITS[item.id]}
                        alt={item.nameBe}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        style={{ border: `2px solid ${CATEGORY_HEX_MAP[item.category]}` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">
                          {lang === 'be' ? item.nameBe : item.nameRu}
                        </div>
                        <div className="text-[10.5px] truncate" style={{ color: 'var(--ink-soft)' }}>
                          {item.years} • {lang === 'be' ? item.placeBe : item.placeRu}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bridge / Path Explorer Toggle */}
            <button
              type="button"
              onClick={() => setPathBarOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer"
              style={{
                background: pathBarOpen || activePath.length > 0 ? 'var(--gold)' : 'var(--bg-card)',
                borderColor: pathBarOpen || activePath.length > 0 ? 'var(--gold)' : 'var(--line)',
                color: pathBarOpen || activePath.length > 0 ? '#2b2620' : 'var(--ink)'
              }}
            >
              <Route className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {lang === 'be' ? 'Шлях пакаленняў' : 'Мост поколений'}
              </span>
            </button>

            {/* Language Switcher БЕЛ / РУС */}
            <button
              type="button"
              onClick={() => setLang((l) => (l === 'be' ? 'ru' : 'be'))}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--line)',
                color: 'var(--ink)'
              }}
              title="Змяніць мову інтэрфейсу / Сменить язык интерфейса"
            >
              {lang === 'be' ? 'БЕЛ · RU' : 'РУС · BE'}
            </button>

            {/* Light / Night Archival Theme Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-1.5 rounded-full border transition cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--line)',
                color: 'var(--ink)'
              }}
              title={lang === 'be' ? 'Змяніць тэму' : 'Переключить тему'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Category Filter Pills + Interactive Century Range Filter */}
      <div
        className="relative z-20 px-4 sm:px-8 py-2 border-b flex flex-wrap items-center justify-between gap-2"
        style={{
          background: darkMode ? 'rgba(32, 28, 24, 0.85)' : 'rgba(244, 239, 228, 0.78)',
          borderColor: 'var(--line)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer"
                style={{
                  background: isActive ? cat.colorVar : 'transparent',
                  borderColor: isActive ? cat.colorVar : 'var(--line)',
                  color: isActive ? '#ffffff' : 'var(--ink)'
                }}
              >
                {cat.id !== 'all' && !isActive && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: cat.colorVar }}
                  />
                )}
                <span>{lang === 'be' ? cat.labelBe : cat.labelRu}</span>
                <span className="opacity-75 text-[10.5px]">({categoryCounts[cat.id] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Chronological Year Filter Control */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="font-medium whitespace-nowrap">
            {lang === 'be' ? 'Перыяд:' : 'Годы:'}{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {yearRange[0]}–{yearRange[1]}
            </strong>
          </span>
          <input
            type="range"
            min={1100}
            max={1990}
            step={10}
            value={yearRange[0]}
            onChange={(e) => {
              const v = Number(e.target.value);
              setYearRange(([_, max]) => [Math.min(v, max - 20), max]);
            }}
            className="w-20 sm:w-24 accent-[#8b1e2b] cursor-pointer"
            title={lang === 'be' ? 'Ад года нараджэння' : 'Начало периода'}
          />
          <input
            type="range"
            min={1160}
            max={2026}
            step={10}
            value={yearRange[1]}
            onChange={(e) => {
              const v = Number(e.target.value);
              setYearRange(([min, _]) => [min, Math.max(v, min + 20)]);
            }}
            className="w-20 sm:w-24 accent-[#8b1e2b] cursor-pointer"
            title={lang === 'be' ? 'Да года' : 'Конец периода'}
          />
          {(yearRange[0] > 1100 || yearRange[1] < 2026) && (
            <button
              type="button"
              onClick={() => setYearRange([1100, 2026])}
              className="text-[11px] font-semibold underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
            >
              {lang === 'be' ? 'Усе' : 'Все'}
            </button>
          )}
        </div>
      </div>

      {/* Optional Generational Path Finder & Active Breadcrumb Strip */}
      <PathExplorerBar
        lang={lang}
        isOpen={pathBarOpen}
        fromId={pathFromId}
        toId={pathToId}
        activePath={activePath}
        onChangeFrom={setPathFromId}
        onChangeTo={setPathToId}
        onApplyPath={handleApplyPath}
        onClearPath={() => setActivePath([])}
        onCloseBar={() => setPathBarOpen(false)}
        onClickStepPerson={(id) => handleSelectPerson(id, true)}
      />

      {/* Main Split Workspace: Interactive Visualization + Expandable Archival Dossier */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_405px] lg:h-[calc(100vh-132px)] relative z-10 overflow-hidden">
        {/* Left Viewport: Force-Directed Network OR Spatial Timeline Graph OR Illustrated Chronicle */}
        <div className="h-[62vh] lg:h-full relative overflow-hidden">
          {viewMode === 'chronicle' ? (
            <ChronicleView
              lang={lang}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              yearRange={yearRange}
              selectedPersonId={selectedPersonId}
              activePath={activePath}
              onSelectPerson={(id) => handleSelectPerson(id, false)}
            />
          ) : (
            <GraphCanvas
              mode={viewMode}
              lang={lang}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              yearRange={yearRange}
              selectedPersonId={selectedPersonId}
              activePath={activePath}
              focusOnlyConnections={focusOnlyConnections}
              onToggleFocusOnly={() => setFocusOnlyConnections((v) => !v)}
              onSelectPerson={(id) => handleSelectPerson(id, false)}
              focusRequestCounter={focusRequestCounter}
            />
          )}
        </div>

        {/* Right Archival Info Panel */}
        <aside
          className="relative overflow-y-auto border-t lg:border-t-0 lg:border-l h-full"
          style={{
            background: 'var(--bg-paper)',
            borderColor: 'var(--line)'
          }}
        >
          <div
            className="w-full h-1 sticky top-0 z-10"
            style={{
              background: 'linear-gradient(90deg, var(--accent), var(--gold), var(--accent))'
            }}
          />
          <PersonDetailPanel
            personId={selectedPersonId}
            lang={lang}
            activePath={activePath}
            onSelectPerson={handleSelectPerson}
            onClosePerson={() => setSelectedPersonId(null)}
            onSelectPresetPath={handleApplyPath}
            onStartCustomPathFrom={handleStartCustomPathFrom}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
