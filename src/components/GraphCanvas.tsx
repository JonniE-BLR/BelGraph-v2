import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Focus,
  LocateFixed,
  Maximize2,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_HEX_MAP,
  GRAPH_LINKS,
  PEOPLE,
  PEOPLE_MAP,
  TIMELINE_LANES,
  TIMELINE_LANE_Y,
  TIMELINE_TICKS,
  computeNetworkPositions,
  computeTimelinePositions,
  yearToTimelineX
} from '../data/people';
import { PORTRAITS } from '../data/portraits';
import { CategoryId, Language, ViewMode } from '../types/person';

interface GraphCanvasProps {
  mode: Extract<ViewMode, 'network' | 'timeline-graph'>;
  lang: Language;
  activeCategory: CategoryId | 'all';
  searchQuery: string;
  yearRange: [number, number];
  selectedPersonId: string | null;
  activePath: string[];
  focusOnlyConnections: boolean;
  onToggleFocusOnly: () => void;
  onSelectPerson: (id: string) => void;
  focusRequestCounter: number;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

const MIN_ZOOM = 0.28;
const MAX_ZOOM = 3.5;

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  mode,
  lang,
  activeCategory,
  searchQuery,
  yearRange,
  selectedPersonId,
  activePath,
  focusOnlyConnections,
  onToggleFocusOnly,
  onSelectPerson,
  focusRequestCounter
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const baseNetworkPos = useMemo(() => computeNetworkPositions(), []);
  const baseTimelinePos = useMemo(() => computeTimelinePositions(), []);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => ({ ...baseNetworkPos })
  );
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({ ...baseNetworkPos });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [livePhysics, setLivePhysics] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 0.62 });
  const transformRef = useRef<Transform>({ x: 0, y: 0, k: 0.62 });
  const cameraAnimRef = useRef<number | null>(null);

  const updateTransform = useCallback((next: Transform | ((prev: Transform) => Transform)) => {
    setTransform((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      transformRef.current = resolved;
      return resolved;
    });
  }, []);

  const animateCameraTo = useCallback(
    (target: Transform) => {
      if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current);
      const start = { ...transformRef.current };
      const startTime = performance.now();
      const duration = 520;

      const tick = (now: number) => {
        const elapsed = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - elapsed, 3);
        const cur: Transform = {
          x: start.x + (target.x - start.x) * ease,
          y: start.y + (target.y - start.y) * ease,
          k: start.k + (target.k - start.k) * ease
        };
        transformRef.current = cur;
        setTransform(cur);
        if (elapsed < 1) {
          cameraAnimRef.current = requestAnimationFrame(tick);
        }
      };
      cameraAnimRef.current = requestAnimationFrame(tick);
    },
    []
  );

  // Fit entire graph or active path neatly inside container
  const fitViewport = useCallback(
    (instant = false, targetIds?: string[]) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const targetMap = mode === 'network' ? baseNetworkPos : baseTimelinePos;
      const pts = (targetIds && targetIds.length > 0 ? targetIds : PEOPLE.map((p) => p.id))
        .map((id) => positionsRef.current[id] || targetMap[id])
        .filter(Boolean);

      if (pts.length === 0) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const pt of pts) {
        minX = Math.min(minX, pt.x - 95);
        maxX = Math.max(maxX, pt.x + 95);
        minY = Math.min(minY, pt.y - 85);
        maxY = Math.max(maxY, pt.y + 95);
      }

      const contentW = Math.max(280, maxX - minX);
      const contentH = Math.max(240, maxY - minY);
      const pad = 44;
      const scaleX = (rect.width - pad * 2) / contentW;
      const scaleY = (rect.height - pad * 2) / contentH;
      const k = Math.max(MIN_ZOOM, Math.min(1.35, Math.min(scaleX, scaleY)));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const target: Transform = {
        k,
        x: rect.width / 2 - centerX * k,
        y: rect.height / 2 - centerY * k
      };

      if (instant) {
        updateTransform(target);
      } else {
        animateCameraTo(target);
      }
    },
    [animateCameraTo, baseNetworkPos, baseTimelinePos, mode, updateTransform]
  );

  // Initial fit on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => fitViewport(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate node positions smoothly whenever mode switches between Network and Timeline-Graph
  useEffect(() => {
    const targetMap = mode === 'network' ? baseNetworkPos : baseTimelinePos;
    const startMap: Record<string, { x: number; y: number }> = {};
    for (const p of PEOPLE) {
      startMap[p.id] = { ...(positionsRef.current[p.id] || targetMap[p.id]) };
    }

    let frameId: number;
    const startTime = performance.now();
    const duration = 680;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const next: Record<string, { x: number; y: number }> = {};
      for (const p of PEOPLE) {
        const s = startMap[p.id];
        const e = targetMap[p.id];
        next[p.id] = {
          x: s.x + (e.x - s.x) * ease,
          y: s.y + (e.y - s.y) * ease
        };
      }
      positionsRef.current = next;
      setPositions(next);
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    // Smoothly adjust camera for new layout bounds
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const pts = Object.values(targetMap);
      const minX = Math.min(...pts.map((p) => p.x)) - 110;
      const maxX = Math.max(...pts.map((p) => p.x)) + 110;
      const minY = Math.min(...pts.map((p) => p.y)) - 95;
      const maxY = Math.max(...pts.map((p) => p.y)) + 105;
      const k = Math.max(
        MIN_ZOOM,
        Math.min(1.15, Math.min((rect.width - 64) / (maxX - minX), (rect.height - 64) / (maxY - minY)))
      );
      animateCameraTo({
        k,
        x: rect.width / 2 - ((minX + maxX) / 2) * k,
        y: rect.height / 2 - ((minY + maxY) / 2) * k
      });
    }

    return () => cancelAnimationFrame(frameId);
  }, [animateCameraTo, baseNetworkPos, baseTimelinePos, mode]);

  // Camera glide when user explicitly focuses a person or selects a path
  useEffect(() => {
    if (focusRequestCounter === 0) return;
    if (activePath.length > 1) {
      fitViewport(false, activePath);
      return;
    }
    if (!selectedPersonId) return;
    const el = containerRef.current;
    const pt = positionsRef.current[selectedPersonId];
    if (!el || !pt) return;
    const rect = el.getBoundingClientRect();
    const targetK = Math.max(transformRef.current.k, 0.95);
    animateCameraTo({
      k: Math.min(1.45, targetK),
      x: rect.width / 2 - pt.x * Math.min(1.45, targetK),
      y: rect.height / 2 - pt.y * Math.min(1.45, targetK)
    });
  }, [activePath, animateCameraTo, fitViewport, focusRequestCounter, selectedPersonId]);

  // Optional live spring physics simulation when toggled ON
  const dragNodeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!livePhysics || mode !== 'network') return;
    let raf: number;
    const velocities: Record<string, { vx: number; vy: number }> = {};
    for (const p of PEOPLE) velocities[p.id] = { vx: 0, vy: 0 };

    const loop = () => {
      const cur = positionsRef.current;
      const next: Record<string, { x: number; y: number }> = {};
      for (const p of PEOPLE) {
        next[p.id] = { ...cur[p.id] };
      }

      for (let i = 0; i < PEOPLE.length; i++) {
        for (let j = i + 1; j < PEOPLE.length; j++) {
          const idA = PEOPLE[i].id;
          const idB = PEOPLE[j].id;
          const a = next[idA];
          const b = next[idB];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = Math.max(400, dx * dx + dy * dy);
          const d = Math.sqrt(d2);
          const f = 900 / d2 + (d < 118 ? (118 - d) * 0.08 : 0);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          velocities[idA].vx -= fx;
          velocities[idA].vy -= fy;
          velocities[idB].vx += fx;
          velocities[idB].vy += fy;
        }
      }

      for (const l of GRAPH_LINKS) {
        const a = next[l.source];
        const b = next[l.target];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - 205) * 0.008;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        velocities[l.source].vx += fx;
        velocities[l.source].vy += fy;
        velocities[l.target].vx -= fx;
        velocities[l.target].vy -= fy;
      }

      for (const p of PEOPLE) {
        if (dragNodeRef.current === p.id || p.isCentralHub) continue;
        const anchor = baseNetworkPos[p.id];
        velocities[p.id].vx += (anchor.x - next[p.id].x) * 0.006;
        velocities[p.id].vy += (anchor.y - next[p.id].y) * 0.006;
        velocities[p.id].vx *= 0.82;
        velocities[p.id].vy *= 0.82;
        next[p.id].x += velocities[p.id].vx;
        next[p.id].y += velocities[p.id].vy;
      }

      positionsRef.current = next;
      setPositions(next);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [baseNetworkPos, livePhysics, mode]);

  // Cursor-centered mouse wheel zoom (non-passive to prevent outer scroll hijack)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraAnimRef.current) {
        cancelAnimationFrame(cameraAnimRef.current);
        cameraAnimRef.current = null;
      }
      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const delta = -e.deltaY * (e.deltaMode === 1 ? 0.04 : 0.0014);
      const factor = Math.exp(delta);

      updateTransform((prev) => {
        const nextK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.k * factor));
        const scaleRatio = nextK / prev.k;
        return {
          k: nextK,
          x: pointerX - (pointerX - prev.x) * scaleRatio,
          y: pointerY - (pointerY - prev.y) * scaleRatio
        };
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [updateTransform]);

  // Pointer pan, node drag & pinch zoom state
  const panStateRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  }>({ isPanning: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });

  const nodeDragStateRef = useRef<{
    id: string | null;
    startClientX: number;
    startClientY: number;
    origNodeX: number;
    origNodeY: number;
    moved: boolean;
  }>({ id: null, startClientX: 0, startClientY: 0, origNodeX: 0, origNodeY: 0, moved: false });

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDistRef = useRef<number | null>(null);

  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
      cameraAnimRef.current = null;
    }
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      pinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      panStateRef.current.isPanning = false;
      return;
    }

    if (nodeDragStateRef.current.id) return;

    panStateRef.current = {
      isPanning: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: transformRef.current.x,
      origY: transformRef.current.y,
      moved: false
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch zoom for touch devices
    if (activePointersRef.current.size === 2 && containerRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (pinchDistRef.current && dist > 8) {
        const rect = containerRef.current.getBoundingClientRect();
        const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
        const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
        const factor = dist / pinchDistRef.current;
        updateTransform((prev) => {
          const nextK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.k * factor));
          const ratio = nextK / prev.k;
          return {
            k: nextK,
            x: midX - (midX - prev.x) * ratio,
            y: midY - (midY - prev.y) * ratio
          };
        });
      }
      pinchDistRef.current = dist;
      return;
    }

    // Individual node drag
    if (nodeDragStateRef.current.id) {
      const ds = nodeDragStateRef.current;
      const dxScreen = e.clientX - ds.startClientX;
      const dyScreen = e.clientY - ds.startClientY;
      if (Math.hypot(dxScreen, dyScreen) > 4) {
        ds.moved = true;
      }
      const nextX = ds.origNodeX + dxScreen / transformRef.current.k;
      const nextY = ds.origNodeY + dyScreen / transformRef.current.k;
      const id = ds.id!;
      const updated = {
        ...positionsRef.current,
        [id]: { x: nextX, y: nextY }
      };
      positionsRef.current = updated;
      setPositions(updated);
      return;
    }

    // Canvas panning
    if (panStateRef.current.isPanning) {
      const dx = e.clientX - panStateRef.current.startX;
      const dy = e.clientY - panStateRef.current.startY;
      if (Math.hypot(dx, dy) > 3) panStateRef.current.moved = true;
      updateTransform((prev) => ({
        ...prev,
        x: panStateRef.current.origX + dx,
        y: panStateRef.current.origY + dy
      }));
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchDistRef.current = null;
    }
    panStateRef.current.isPanning = false;
    if (nodeDragStateRef.current.id) {
      const draggedId = nodeDragStateRef.current.id;
      const didMove = nodeDragStateRef.current.moved;
      nodeDragStateRef.current.id = null;
      dragNodeRef.current = null;
      if (!didMove) {
        onSelectPerson(draggedId);
      }
    }
  };

  const handleZoomStep = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const prev = transformRef.current;
    const nextK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.k * factor));
    const ratio = nextK / prev.k;
    animateCameraTo({
      k: nextK,
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio
    });
  };

  const handleCenterSkaryna = () => {
    const el = containerRef.current;
    const pt = positionsRef.current['skorina'];
    if (!el || !pt) return;
    const rect = el.getBoundingClientRect();
    const k = 1.05;
    animateCameraTo({
      k,
      x: rect.width / 2 - pt.x * k,
      y: rect.height / 2 - pt.y * k
    });
    onSelectPerson('skorina');
  };

  const handleResetPositions = () => {
    const base = mode === 'network' ? baseNetworkPos : baseTimelinePos;
    positionsRef.current = { ...base };
    setPositions({ ...base });
    fitViewport(false);
  };

  // Visibility & highlight sets
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of PEOPLE) {
      const catMatch = activeCategory === 'all' || p.category === activeCategory;
      const yearMatch = p.birthYear >= yearRange[0] && p.birthYear <= yearRange[1];
      const textMatch =
        !normalizedQuery ||
        p.nameBe.toLowerCase().includes(normalizedQuery) ||
        p.nameRu.toLowerCase().includes(normalizedQuery) ||
        p.roleBe.toLowerCase().includes(normalizedQuery) ||
        p.roleRu.toLowerCase().includes(normalizedQuery) ||
        p.placeBe.toLowerCase().includes(normalizedQuery) ||
        p.placeRu.toLowerCase().includes(normalizedQuery);
      if (catMatch && yearMatch && textMatch) {
        set.add(p.id);
      }
    }
    return set;
  }, [activeCategory, normalizedQuery, yearRange]);

  const pathPairSet = useMemo(() => {
    const pairs = new Set<string>();
    for (let i = 0; i < activePath.length - 1; i++) {
      const a = activePath[i];
      const b = activePath[i + 1];
      pairs.add(a < b ? `${a}--${b}` : `${b}--${a}`);
    }
    return pairs;
  }, [activePath]);

  const pathIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    activePath.forEach((id, idx) => map.set(id, idx + 1));
    return map;
  }, [activePath]);

  const focusAnchorId = hoveredId || (focusOnlyConnections ? selectedPersonId : null);

  const relatedSet = useMemo(() => {
    if (activePath.length > 0 && !hoveredId) {
      return new Set<string>(activePath);
    }
    if (!focusAnchorId) return null;
    const person = PEOPLE_MAP[focusAnchorId];
    if (!person) return null;
    return new Set<string>([focusAnchorId, ...person.connections]);
  }, [activePath, focusAnchorId, hoveredId]);

  const selectedConnectionsSet = useMemo(() => {
    if (!selectedPersonId || !PEOPLE_MAP[selectedPersonId]) return new Set<string>();
    return new Set<string>([selectedPersonId, ...PEOPLE_MAP[selectedPersonId].connections]);
  }, [selectedPersonId]);

  // Minimap coordinate bounds
  const worldBounds = useMemo(() => {
    if (mode === 'network') {
      return { minX: -60, maxX: 1860, minY: -160, maxY: 1400 };
    }
    return { minX: 0, maxX: 2740, minY: 40, maxY: 1230 };
  }, [mode]);

  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clickRatioX = (e.clientX - svgRect.left) / svgRect.width;
    const clickRatioY = (e.clientY - svgRect.top) / svgRect.height;
    const worldX = worldBounds.minX + clickRatioX * (worldBounds.maxX - worldBounds.minX);
    const worldY = worldBounds.minY + clickRatioY * (worldBounds.maxY - worldBounds.minY);
    const viewRect = el.getBoundingClientRect();
    animateCameraTo({
      k: transformRef.current.k,
      x: viewRect.width / 2 - worldX * transformRef.current.k,
      y: viewRect.height / 2 - worldY * transformRef.current.k
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 48%, rgba(184, 146, 58, 0.08) 0%, transparent 68%)'
      }}
    >
      {/* Top-Left Contextual Mode Badge */}
      <div
        className="pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium z-10"
        style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--line)',
          color: 'var(--ink-soft)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Compass className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        <span>
          {mode === 'network'
            ? lang === 'be'
              ? 'Цэнтр сусвету: Францыск Скарына • Круціце кола мышы для маштабу • Цягніце вузлы'
              : 'Центр графа: Франциск Скорина • Колесо мыши — масштаб • Узлы можно перетаскивать'
            : lang === 'be'
              ? 'Храналагічныя дарожкі па сферах і стагоддзях (XII–XXI стст.)'
              : 'Хронологические дорожки по сферам и столетиям (XII–XXI вв.)'}
        </span>
      </div>

      {/* Main Interactive SVG Viewport */}
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none"
        style={{ cursor: panStateRef.current.isPanning ? 'grabbing' : 'grab' }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        <defs>
          {/* Circular clip paths for every portrait */}
          {PEOPLE.map((person) => {
            const r = person.isCentralHub ? 39 : person.significance === 3 ? 30 : 25;
            return (
              <clipPath key={`clip-${person.id}`} id={`clip-${person.id}`}>
                <circle cx={0} cy={0} r={r - 2.5} />
              </clipPath>
            );
          })}
          <radialGradient id="skarynaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(184, 146, 58, 0.36)" />
            <stop offset="55%" stopColor="rgba(139, 30, 43, 0.12)" />
            <stop offset="100%" stopColor="rgba(184, 146, 58, 0)" />
          </radialGradient>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Background guide geometry: Concentric Era Orbits (Network) OR Century Swimlanes (Timeline) */}
          {mode === 'network' ? (
            <g className="pointer-events-none">
              <circle cx={900} cy={620} r={240} fill="url(#skarynaGlow)" />
              {[
                { r: 215, label: 'XII–XVII стст. Асветнікі і вытокі' },
                { r: 385, label: 'XVIII–XIX стст. Рамантызм і навука' },
                { r: 545, label: 'ХХ ст. Адраджэнне і мадэрн' },
                { r: 690, label: 'ХХ ст. Космас, фізіка і эпас' },
                { r: 825, label: 'XXI ст. Сучасныя IT, МКС і Алімп' }
              ].map((ring) => (
                <g key={ring.r}>
                  <ellipse
                    cx={900}
                    cy={620}
                    rx={ring.r}
                    ry={ring.r * 0.88}
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth={1}
                    strokeDasharray="5 7"
                    opacity={0.48}
                  />
                  <text
                    x={900}
                    y={620 - ring.r * 0.88 - 7}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={500}
                    fill="var(--ink-soft)"
                    opacity={0.62}
                    letterSpacing="0.06em"
                  >
                    {ring.label}
                  </text>
                </g>
              ))}
            </g>
          ) : (
            <g className="pointer-events-none">
              {/* Horizontal Category Swimlanes */}
              {TIMELINE_LANES.map((catId, idx) => {
                const y = TIMELINE_LANE_Y[catId];
                const meta = CATEGORIES.find((c) => c.id === catId)!;
                return (
                  <g key={catId}>
                    <rect
                      x={40}
                      y={y - 82}
                      width={2670}
                      height={164}
                      rx={16}
                      fill={idx % 2 === 0 ? 'rgba(184, 146, 58, 0.055)' : 'rgba(139, 30, 43, 0.03)'}
                      stroke="var(--line)"
                      strokeOpacity={0.35}
                    />
                    <line
                      x1={55}
                      y1={y}
                      x2={2690}
                      y2={y}
                      stroke={CATEGORY_HEX_MAP[catId]}
                      strokeOpacity={0.22}
                      strokeDasharray="4 6"
                    />
                    <rect
                      x={56}
                      y={y - 72}
                      width={195}
                      height={26}
                      rx={13}
                      fill={CATEGORY_HEX_MAP[catId]}
                      opacity={0.9}
                    />
                    <text
                      x={153}
                      y={y - 55}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="#ffffff"
                    >
                      {lang === 'be' ? meta.labelBe : meta.labelRu}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Historical Century Markers */}
              {TIMELINE_TICKS.map((tick) => {
                const tx = yearToTimelineX(tick.year);
                return (
                  <g key={tick.year}>
                    <line
                      x1={tx}
                      y1={55}
                      x2={tx}
                      y2={1210}
                      stroke="var(--accent)"
                      strokeOpacity={0.2}
                      strokeDasharray="3 5"
                    />
                    <rect
                      x={tx - 92}
                      y={32}
                      width={184}
                      height={26}
                      rx={6}
                      fill="var(--bg-paper)"
                      stroke="var(--line)"
                    />
                    <text
                      x={tx}
                      y={49}
                      textAnchor="middle"
                      fontSize={11.5}
                      fontWeight={700}
                      fill="var(--accent)"
                    >
                      {lang === 'be' ? tick.labelBe : tick.labelRu}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Generational Connection Links Layer */}
          <g className="links-layer">
            {GRAPH_LINKS.map((link) => {
              if (!visibleIds.has(link.source) || !visibleIds.has(link.target)) return null;
              const p1 = positions[link.source];
              const p2 = positions[link.target];
              if (!p1 || !p2) return null;

              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const curveLift = mode === 'network' ? Math.min(65, Math.abs(dx) * 0.13) : Math.min(85, Math.abs(dx) * 0.11);
              const cx = p1.x + dx * 0.5;
              const cy = p1.y + dy * 0.5 - curveLift;
              const d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;

              const isPathEdge = pathPairSet.has(link.key);
              const isHoverEdge =
                hoveredId === link.source || hoveredId === link.target;
              const isSelectedEdge =
                !hoveredId &&
                selectedPersonId !== null &&
                (selectedPersonId === link.source || selectedPersonId === link.target);

              const isHighlighted = isPathEdge || isHoverEdge || isSelectedEdge;
              const isDimmed =
                relatedSet !== null
                  ? !isHighlighted
                  : selectedPersonId !== null && !isSelectedEdge
                    ? false
                    : false;

              let strokeColor = 'var(--line)';
              let strokeW = 1.35;
              let opacity = selectedPersonId && !isHighlighted ? 0.28 : 0.52;

              if (isPathEdge) {
                strokeColor = 'var(--gold)';
                strokeW = 3.6;
                opacity = 1;
              } else if (isHoverEdge) {
                strokeColor = 'var(--accent)';
                strokeW = 2.8;
                opacity = 0.98;
              } else if (isSelectedEdge) {
                strokeColor = 'var(--accent)';
                strokeW = 2.3;
                opacity = 0.9;
              } else if (isDimmed) {
                opacity = 0.08;
              }

              return (
                <g key={link.key}>
                  <path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    opacity={opacity}
                    strokeLinecap="round"
                  />
                  {(isPathEdge || isHoverEdge || isSelectedEdge) && (
                    <path
                      d={d}
                      fill="none"
                      stroke={isPathEdge ? '#fff3d1' : 'var(--gold)'}
                      strokeWidth={isPathEdge ? 2 : 1.4}
                      opacity={0.85}
                      className="link-flow pointer-events-none"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Portrait Nodes Layer */}
          <g className="nodes-layer">
            {PEOPLE.map((person) => {
              if (!visibleIds.has(person.id)) return null;
              const pos = positions[person.id];
              if (!pos) return null;

              const r = person.isCentralHub ? 39 : person.significance === 3 ? 30 : 25;
              const isSelected = selectedPersonId === person.id;
              const isHovered = hoveredId === person.id;
              const pathStep = pathIndexMap.get(person.id);
              const isInPath = pathStep !== undefined;

              const isDimmed =
                relatedSet !== null
                  ? !relatedSet.has(person.id)
                  : false;

              const isDirectNeighbor =
                !isSelected && selectedConnectionsSet.has(person.id);

              const scale = isHovered ? 1.14 : isSelected ? 1.12 : 1;
              const catColor = CATEGORY_HEX_MAP[person.category];
              const displayName = lang === 'be' ? person.nameBe : person.nameRu;

              return (
                <g
                  key={person.id}
                  transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
                  style={{
                    cursor: 'pointer',
                    opacity: isDimmed ? 0.18 : 1,
                    transition: 'opacity 0.28s ease'
                  }}
                  onMouseEnter={() => setHoveredId(person.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === person.id ? null : prev))}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragNodeRef.current = person.id;
                    nodeDragStateRef.current = {
                      id: person.id,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      origNodeX: pos.x,
                      origNodeY: pos.y,
                      moved: false
                    };
                  }}
                >
                  {/* Central Hub pulsing golden halo */}
                  {person.isCentralHub && (
                    <circle
                      cx={0}
                      cy={0}
                      r={r + 12}
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth={2.5}
                      className="hub-halo"
                    />
                  )}

                  {/* Active selection / Path outer halo */}
                  {(isSelected || isInPath || isDirectNeighbor) && (
                    <circle
                      cx={0}
                      cy={0}
                      r={r + (isSelected || isInPath ? 6.5 : 4)}
                      fill="none"
                      stroke={isInPath ? 'var(--gold)' : isSelected ? 'var(--accent)' : catColor}
                      strokeWidth={isSelected || isInPath ? 2.6 : 1.5}
                      strokeDasharray={isDirectNeighbor && !isInPath ? '4 3' : undefined}
                      opacity={0.92}
                    />
                  )}

                  {/* Colored Frame Backing Circle */}
                  <circle
                    cx={0}
                    cy={0}
                    r={r}
                    fill={catColor}
                    stroke="var(--bg)"
                    strokeWidth={2.5}
                  />

                  {/* Verified Real Portrait Photo */}
                  <image
                    href={PORTRAITS[person.id]}
                    x={-(r - 2.5)}
                    y={-(r - 2.5)}
                    width={(r - 2.5) * 2}
                    height={(r - 2.5) * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#clip-${person.id})`}
                  />

                  {/* Crisp colored inner ring border around photo */}
                  <circle
                    cx={0}
                    cy={0}
                    r={r - 2.5}
                    fill="none"
                    stroke={catColor}
                    strokeWidth={2.6}
                  />

                  {/* Central Hub Crown Star OR Category Indicator Dot */}
                  {person.isCentralHub ? (
                    <g transform={`translate(0, ${-r - 2})`}>
                      <circle cx={0} cy={0} r={9} fill="var(--gold)" stroke="var(--bg)" strokeWidth={1.5} />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill="#2b2620"
                      >
                        ❦
                      </text>
                    </g>
                  ) : (
                    <circle
                      cx={r * 0.72}
                      cy={-r * 0.72}
                      r={5.2}
                      fill={catColor}
                      stroke="var(--bg)"
                      strokeWidth={1.8}
                    />
                  )}

                  {/* Lineage Path Step Badge (1 -> 2 -> 3...) */}
                  {isInPath && (
                    <g transform={`translate(${-r * 0.75}, ${-r * 0.75})`}>
                      <circle
                        cx={0}
                        cy={0}
                        r={10.5}
                        fill="var(--gold)"
                        stroke="#2b2620"
                        strokeWidth={1.6}
                      />
                      <text
                        x={0}
                        y={3.8}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontWeight={800}
                        fill="#2b2620"
                      >
                        {pathStep}
                      </text>
                    </g>
                  )}

                  {/* Readable Name & Years Label Pill */}
                  <g transform={`translate(0, ${r + 14})`} className="pointer-events-none">
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize={person.isCentralHub ? 13 : 11.2}
                      fontWeight={isSelected || person.isCentralHub ? 700 : 600}
                      fill="var(--ink)"
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'var(--bg)',
                        strokeWidth: 4,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                      }}
                    >
                      {displayName}
                    </text>
                    <text
                      x={0}
                      y={13}
                      textAnchor="middle"
                      fontSize={9.4}
                      fontWeight={500}
                      fill="var(--ink-soft)"
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'var(--bg)',
                        strokeWidth: 3.2,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                      }}
                    >
                      {person.years}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Bottom-Left Category Legend */}
      <div
        className="hidden md:block rounded-xl px-3.5 py-2.5 z-10 text-xs"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div
          className="font-semibold uppercase tracking-wider mb-1.5"
          style={{ fontSize: '10px', color: 'var(--ink-soft)' }}
        >
          {lang === 'be' ? 'Сферы ўплыву' : 'Сферы влияния'} ({visibleIds.size}/{PEOPLE.length})
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: cat.colorVar }}
              />
              <span className="truncate text-[11px]">
                {lang === 'be' ? cat.labelBe : cat.labelRu}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-Right Floating Zoom, Physics & Navigation Controls */}
      <div
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 z-20"
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <button
          type="button"
          onClick={() => handleZoomStep(1 / 1.25)}
          title={lang === 'be' ? 'Паменшыць маштаб' : 'Отдалить'}
          className="p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
          style={{ color: 'var(--ink)' }}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span
          className="text-xs font-semibold tabular-nums min-w-[44px] text-center"
          style={{ color: 'var(--ink)' }}
        >
          {Math.round(transform.k * 100)}%
        </span>

        <button
          type="button"
          onClick={() => handleZoomStep(1.25)}
          title={lang === 'be' ? 'Павялічыць маштаб' : 'Приблизить'}
          className="p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
          style={{ color: 'var(--ink)' }}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px mx-0.5" style={{ background: 'var(--line)' }} />

        <button
          type="button"
          onClick={() => fitViewport(false)}
          title={lang === 'be' ? 'Умясціць увесь граф' : 'Показать весь граф'}
          className="p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
          style={{ color: 'var(--ink)' }}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleCenterSkaryna}
          title={lang === 'be' ? 'У цэнтр да Францыска Скарыны' : 'К центру — Франциск Скорина'}
          className="px-2 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
          style={{
            background: 'rgba(139, 30, 43, 0.12)',
            color: 'var(--accent)'
          }}
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === 'be' ? 'Скарына' : 'Скорина'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleFocusOnly}
          title={
            lang === 'be'
              ? 'Падсвечваць толькі сувязі абранай асобы'
              : 'Подсвечивать только связи выбранной личности'
          }
          className="p-1.5 rounded-full transition cursor-pointer"
          style={{
            background: focusOnlyConnections ? 'var(--accent)' : 'transparent',
            color: focusOnlyConnections ? '#fff' : 'var(--ink)'
          }}
        >
          <Focus className="w-4 h-4" />
        </button>

        {mode === 'network' && (
          <button
            type="button"
            onClick={() => setLivePhysics((v) => !v)}
            title={
              lang === 'be'
                ? 'Жывая фізічная сімуляцыя спружын (Force-directed)'
                : 'Живая физика притяжения/отталкивания (Force-directed)'
            }
            className="p-1.5 rounded-full transition cursor-pointer"
            style={{
              background: livePhysics ? 'var(--gold)' : 'transparent',
              color: livePhysics ? '#2b2620' : 'var(--ink)'
            }}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleResetPositions}
          title={lang === 'be' ? 'Скінуць раскладку' : 'Сбросить позиции'}
          className="p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
          style={{ color: 'var(--ink)' }}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Top-Right Interactive Minimap */}
      {showMinimap && (
        <div
          className="hidden lg:block rounded-xl overflow-hidden z-10"
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            width: mode === 'network' ? '164px' : '210px',
            height: '112px',
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center justify-between px-2 py-0.5 border-b text-[9.5px] font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
            <span>{lang === 'be' ? 'Міні-карта' : 'Мини-карта'}</span>
            <button
              type="button"
              onClick={() => setShowMinimap(false)}
              className="hover:opacity-75 cursor-pointer"
            >
              ×
            </button>
          </div>
          <svg
            viewBox={`${worldBounds.minX} ${worldBounds.minY} ${worldBounds.maxX - worldBounds.minX} ${worldBounds.maxY - worldBounds.minY}`}
            className="w-full h-[92px] cursor-crosshair block"
            onClick={handleMinimapClick}
          >
            {PEOPLE.map((p) => {
              if (!visibleIds.has(p.id)) return null;
              const pt = positions[p.id];
              if (!pt) return null;
              return (
                <circle
                  key={p.id}
                  cx={pt.x}
                  cy={pt.y}
                  r={selectedPersonId === p.id ? 36 : p.isCentralHub ? 32 : 18}
                  fill={selectedPersonId === p.id ? 'var(--accent)' : CATEGORY_HEX_MAP[p.category]}
                  opacity={0.85}
                />
              );
            })}
            {containerRef.current && (
              <rect
                x={-transform.x / transform.k}
                y={-transform.y / transform.k}
                width={containerRef.current.clientWidth / transform.k}
                height={containerRef.current.clientHeight / transform.k}
                fill="rgba(184, 146, 58, 0.14)"
                stroke="var(--accent)"
                strokeWidth={14}
                rx={18}
              />
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
