import React, { useState, useRef, useEffect, useCallback } from "react";

export interface LiquidGlassTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface LiquidGlassTabBarProps {
  items?: LiquidGlassTabItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

/* Ícones preenchidos autorais em SVG puro (zero dependências externas) */
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <path d="M11.18 3.22a1.3 1.3 0 0 1 1.64 0l7.4 6.18c.49.41.78 1.02.78 1.66v7.44A2.5 2.5 0 0 1 18.5 21h-3.75a1 1 0 0 1-1-1v-4.25a1.75 1.75 0 0 0-3.5 0V20a1 1 0 0 1-1 1H5.5A2.5 2.5 0 0 1 3 18.5v-7.44c0-.64.29-1.25.78-1.66l7.4-6.18Z" />
  </svg>
);

const ExploreIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5Zm3.85 5.4L13.85 13.85 8.15 15.85 10.15 10.15 15.85 8.15ZM12 10.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"
    />
  </svg>
);

const InboxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 4H18A3 3 0 0 1 21 7V17A3 3 0 0 1 18 20H6A3 3 0 0 1 3 17V7A3 3 0 0 1 6 4ZM5.2 6.7V12.6H9.4A2.6 2.6 0 0 0 14.6 12.6H18.8V6.7A0.5 0.5 0 0 0 18.3 6.2H5.7A0.5 0.5 0 0 0 5.2 6.7Z"
    />
  </svg>
);

const SavedIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <path d="M6.75 3.5h10.5A2.25 2.25 0 0 1 19.5 5.75v14.32a.85.85 0 0 1-1.36.68L12 16.15l-6.14 4.6a.85.85 0 0 1-1.36-.68V5.75A2.25 2.25 0 0 1 6.75 3.5Z" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="7.75" r="4" />
    <path d="M4.25 19.25c0-3.38 3.47-5.75 7.75-5.75s7.75 2.37 7.75 5.75c0 .83-.67 1.5-1.5 1.5H5.75c-.83 0-1.5-.67-1.5-1.5Z" />
  </svg>
);

const DEFAULT_ITEMS: LiquidGlassTabItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "explore", label: "Explore", icon: <ExploreIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon /> },
  { id: "saved", label: "Saved", icon: <SavedIcon /> },
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
];

function rubberBandClamp(
  val: number,
  min: number,
  max: number,
  overscroll = 14
): number {
  if (val < min) {
    const excess = min - val;
    return min - overscroll * (1 - Math.exp(-excess / 42));
  }
  if (val > max) {
    const excess = val - max;
    return max + overscroll * (1 - Math.exp(-excess / 42));
  }
  return val;
}

export function LiquidGlassTabBar({
  items = DEFAULT_ITEMS,
  value: controlledValue,
  onChange,
  className = "",
  ariaLabel = "App Navigation",
}: LiquidGlassTabBarProps) {
  const [internalId, setInternalId] = useState(items[0]?.id ?? "home");
  const activeId = controlledValue !== undefined ? controlledValue : internalId;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );

  const barRef = useRef<HTMLDivElement>(null);
  const baseLayerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const restFillRef = useRef<HTMLDivElement>(null);
  const glassShellRef = useRef<HTMLDivElement>(null);
  const blueLayerRef = useRef<HTMLDivElement>(null);

  const gestureRef = useRef({
    downX: 0,
    downTime: 0,
    didDrag: false,
    startCenterX: 0,
  });

  const physicsRef = useRef({
    x: 0,
    vx: 0,
    targetX: 0,
    lift: 0,
    vLift: 0,
    targetLift: 0,
    dragging: false,
    initialized: false,
    barWidth: 0,
    barHeight: 54,
    padding: 5,
    slotWidth: 0,
    reducedMotion: false,
  });

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      physicsRef.current.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }
  }, []);

  const getTabCenter = useCallback((index: number, slotW: number, pad: number) => {
    return pad + (index + 0.5) * slotW;
  }, []);

  const measureGeometry = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return null;

    const rect = bar.getBoundingClientRect();
    const padding = 5;
    const barWidth = rect.width;
    const barHeight = rect.height || 64;
    const innerWidth = Math.max(0, barWidth - padding * 2);
    const slotWidth = innerWidth / Math.max(1, items.length);

    return { barWidth, barHeight, padding, slotWidth };
  }, [items.length]);

  const applyDOM = useCallback((centerX: number, vx: number, lift: number) => {
    const p = physicsRef.current;
    const lens = lensRef.current;
    const baseLayer = baseLayerRef.current;
    const restFill = restFillRef.current;
    const glassShell = glassShellRef.current;
    const blueLayer = blueLayerRef.current;

    if (!p.slotWidth || !p.barWidth || !lens) return;

    const W = p.barWidth;
    const H = p.barHeight;
    const clampedLift = Math.max(0, Math.min(1.18, lift));
    const visualLift = Math.max(0, Math.min(1, lift));

    const restW = p.slotWidth;
    const restH = H - 8;

    const liftedW = p.slotWidth + 24;
    const liftedH = H + 18;

    const speed = p.reducedMotion ? 0 : Math.abs(vx);
    const velNorm = Math.min(1, speed / 1150);
    const velStretchX = 1 + velNorm * 0.28 * visualLift;
    const velSquashY = 1 - velNorm * 0.14 * visualLift;

    const w = (restW + (liftedW - restW) * clampedLift) * velStretchX;
    const h = Math.max(restH, (restH + (liftedH - restH) * clampedLift) * velSquashY);

    const bx = centerX - w / 2;
    const by = H / 2 - h / 2;

    lens.style.opacity = "1";
    lens.style.width = `${w.toFixed(2)}px`;
    lens.style.height = `${h.toFixed(2)}px`;
    lens.style.transform = `translate3d(${bx.toFixed(2)}px, ${by.toFixed(2)}px, 0)`;

    if (restFill) {
      restFill.style.opacity = `${Math.max(0, 1 - visualLift * 1.9).toFixed(3)}`;
    }
    if (glassShell) {
      glassShell.style.opacity = `${Math.min(1, visualLift * 1.25).toFixed(3)}`;
    }

    if (blueLayer) {
      const mag = p.reducedMotion ? 1 : 1 + 0.16 * visualLift;
      const tx = w / 2 - centerX * mag;
      const ty = h / 2 - (H / 2) * mag;
      blueLayer.style.width = `${W.toFixed(2)}px`;
      blueLayer.style.height = `${H.toFixed(2)}px`;
      blueLayer.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(
        2
      )}px, 0) scale(${mag.toFixed(4)})`;
    }

    if (baseLayer) {
      const r = Math.max(0, Math.min(w, h) / 2 - 0.05);
      const x1 = bx + r;
      const x2 = Math.max(x1, bx + w - r);
      const y1 = by;
      const y2 = by + h;

      baseLayer.style.clipPath = `path(evenodd, "M -120 -120 H ${(
        W + 120
      ).toFixed(1)} V ${(H + 120).toFixed(1)} H -120 Z M ${x1.toFixed(
        2
      )} ${y1.toFixed(2)} H ${x2.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(
        2
      )} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} H ${x1.toFixed(
        2
      )} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(
        2
      )} ${y1.toFixed(2)} Z")`;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const prev = lastTimeRef.current ?? now;
      const dt = Math.min(0.032, Math.max(0.001, (now - prev) / 1000));
      lastTimeRef.current = now;

      const p = physicsRef.current;

      const posStiffness = p.dragging ? 540 : 280;
      const posDamping = p.dragging ? 31 : 20.5;

      const ax = (p.targetX - p.x) * posStiffness - p.vx * posDamping;
      p.vx += ax * dt;
      p.x += p.vx * dt;

      const liftStiffness = p.targetLift > p.lift ? 420 : 280;
      const liftDamping = p.targetLift > p.lift ? 23 : 22;

      const aLift =
        (p.targetLift - p.lift) * liftStiffness - p.vLift * liftDamping;
      p.vLift += aLift * dt;
      p.lift += p.vLift * dt;
      if (p.lift < 0) p.lift = 0;

      applyDOM(p.x, p.vx, p.lift);

      const settled =
        !p.dragging &&
        Math.abs(p.targetX - p.x) < 0.06 &&
        Math.abs(p.vx) < 0.35 &&
        Math.abs(p.targetLift - p.lift) < 0.002 &&
        Math.abs(p.vLift) < 0.015;

      if (settled) {
        p.x = p.targetX;
        p.vx = 0;
        p.lift = p.targetLift;
        p.vLift = 0;
        applyDOM(p.x, 0, p.lift);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [applyDOM]);

  useEffect(() => {
    const syncLayout = () => {
      const geo = measureGeometry();
      if (!geo || !geo.slotWidth) return;

      const p = physicsRef.current;
      p.barWidth = geo.barWidth;
      p.barHeight = geo.barHeight;
      p.padding = geo.padding;
      p.slotWidth = geo.slotWidth;

      const centerX = getTabCenter(activeIndex, geo.slotWidth, geo.padding);

      if (!p.initialized) {
        p.x = centerX;
        p.targetX = centerX;
        p.initialized = true;
        applyDOM(centerX, 0, p.lift);
      } else if (!p.dragging) {
        p.targetX = centerX;
        startLoop();
      }
    };

    syncLayout();
    const ro = new ResizeObserver(syncLayout);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [activeIndex, applyDOM, getTabCenter, measureGeometry, startLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const findNearestIndex = (x: number, slotW: number, pad: number) => {
    const rawIdx = Math.round((x - pad) / Math.max(1, slotW) - 0.5);
    return Math.max(0, Math.min(items.length - 1, rawIdx));
  };

  const commitTab = (index: number, withFlight = false) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const targetItem = items[clamped];
    if (!targetItem) return;

    const p = physicsRef.current;
    p.targetX = getTabCenter(clamped, p.slotWidth, p.padding);

    if (withFlight) {
      p.targetLift = 1;
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = window.setTimeout(() => {
        if (!physicsRef.current.dragging) {
          physicsRef.current.targetLift = 0;
          startLoop();
        }
      }, 210);
    }

    if (controlledValue === undefined) setInternalId(targetItem.id);
    onChange?.(targetItem.id);
    startLoop();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar) return;
    bar.setPointerCapture(e.pointerId);

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    const geo = measureGeometry();
    const p = physicsRef.current;
    if (geo) {
      p.barWidth = geo.barWidth;
      p.barHeight = geo.barHeight;
      p.padding = geo.padding;
      p.slotWidth = geo.slotWidth;
    }

    const rect = bar.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const touchedIdx = findNearestIndex(localX, p.slotWidth, p.padding);
    const exactCenter = getTabCenter(touchedIdx, p.slotWidth, p.padding);

    p.dragging = true;
    p.targetLift = 1;
    p.targetX = exactCenter;

    gestureRef.current = {
      downX: e.clientX,
      downTime: performance.now(),
      didDrag: false,
      startCenterX: exactCenter,
    };

    startLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    if (!p.dragging) return;

    const deltaX = e.clientX - gestureRef.current.downX;
    if (!gestureRef.current.didDrag) {
      if (Math.abs(deltaX) <= 3) return;
      gestureRef.current.didDrag = true;
    }

    const minX = getTabCenter(0, p.slotWidth, p.padding);
    const maxX = getTabCenter(items.length - 1, p.slotWidth, p.padding);

    const nextX = gestureRef.current.startCenterX + deltaX;
    p.targetX = rubberBandClamp(nextX, minX, maxX, 14);
    startLoop();
  };

  const handlePointerUp = () => {
    const p = physicsRef.current;
    if (!p.dragging) return;
    p.dragging = false;

    const elapsed = performance.now() - gestureRef.current.downTime;
    const isQuickTap = !gestureRef.current.didDrag && elapsed < 240;

    const projectedX = gestureRef.current.didDrag
      ? p.targetX + p.vx * 0.03
      : p.targetX;
    const targetIdx = findNearestIndex(projectedX, p.slotWidth, p.padding);

    if (isQuickTap) {
      commitTab(targetIdx, true);
    } else {
      p.targetLift = 0;
      commitTab(targetIdx, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      commitTab((activeIndex + 1) % items.length, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      commitTab((activeIndex - 1 + items.length) % items.length, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      commitTab(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      commitTab(items.length - 1, true);
    }
  };

  const renderBadge = (badge?: number) => {
    if (!badge || badge <= 0) return null;
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 -right-2.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#162035] shadow-[0_2px_6px_rgba(255,59,48,0.45)]"
      >
        {badge > 9 ? "9+" : badge}
      </span>
    );
  };

  return (
    <div
      className={`relative inline-flex w-full max-w-[450px] select-none ${className}`}
    >
      <div
        ref={barRef}
        role="tablist"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex h-[54px] w-full cursor-grab touch-none items-center rounded-full px-[5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] active:cursor-grabbing"
      >
        {/* Base de Vidro Translúcido da Tab Bar */}
        <div
          aria-hidden="true"
          className="lg-tab-bar-base pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        >
          {/* Reflexo especular simétrico na borda da barra */}
          <div className="lg-tab-bar-specular absolute inset-0 rounded-full opacity-55" />
        </div>

        {/* Camada 1: Ícones base (recortados pela silhueta exata da bolha) */}
        <div
          ref={baseLayerRef}
          className="pointer-events-none absolute inset-0 z-10 flex items-center px-[5px]"
        >
          <div
            className="grid h-full w-full items-center"
            style={{
              gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
            }}
          >
            {items.map((item, idx) => (
              <div
                key={item.id}
                role="tab"
                aria-selected={idx === activeIndex}
                className="flex h-full flex-col items-center justify-center gap-[3px] text-zinc-900 dark:text-zinc-200"
              >
                <span className="relative flex items-center justify-center">
                  {item.icon}
                  {renderBadge(item.badge)}
                </span>
                <span className="text-[11px] leading-[12px] font-semibold tracking-[-0.01em]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Camada 2: Gota única Liquid Glass */}
        <div
          ref={lensRef}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="pointer-events-none absolute top-0 left-0 z-20 overflow-hidden rounded-full will-change-transform"
        >
          {/* Preenchimento discreto de repouso */}
          <div
            ref={restFillRef}
            className="lg-tab-bar-rest-fill absolute inset-0 rounded-full"
          />

          {/* Camada azul ampliada centralizada na gota */}
          <div
            ref={blueLayerRef}
            style={{ transformOrigin: "0 0" }}
            className="absolute top-0 left-0 flex items-center px-[5px] will-change-transform"
          >
            <div
              className="grid h-full w-full items-center"
              style={{
                gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex h-full flex-col items-center justify-center gap-[3px] text-[#007AFF] dark:text-[#60A5FA]"
                >
                  <span className="relative flex items-center justify-center">
                    {item.icon}
                    {renderBadge(item.badge)}
                  </span>
                  <span className="text-[11px] leading-[12px] font-semibold tracking-[-0.01em]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Casca óptica Liquid Glass com borda 100% simétrica */}
          <div
            ref={glassShellRef}
            className="lg-tab-bar-shell absolute inset-0 rounded-full opacity-0"
          >
            {/* Anel especular perfeitamente nivelado no topo e na base */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                padding: "1.5px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.34) 48%, rgba(255,255,255,0.92) 100%)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            {/* Dispersão cromática sutil e simétrica nas curvas laterais */}
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                padding: "2px",
                background:
                  "linear-gradient(90deg, rgba(56,189,248,0.55) 0%, transparent 18%, transparent 82%, rgba(251,146,60,0.45) 100%)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const Component = LiquidGlassTabBar;
export default LiquidGlassTabBar;
