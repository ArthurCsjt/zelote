import React, { useRef, useEffect, useCallback, useState } from "react";

export interface LiquidGlassSegmentedOption {
  id: string;
  label: string;
  dot?: boolean;
}

export interface LiquidGlassSegmentedProps {
  options: LiquidGlassSegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
  /** 'surface' = barra completa (para filtro isolado); 'embedded' = dentro de outro container (ex: meses) */
  variant?: "surface" | "embedded";
  height?: number;
}

function rubberBandClamp(
  val: number,
  min: number,
  max: number,
  overscroll = 10
): number {
  if (val < min) {
    const excess = min - val;
    return min - overscroll * (1 - Math.exp(-excess / 36));
  }
  if (val > max) {
    const excess = val - max;
    return max + overscroll * (1 - Math.exp(-excess / 36));
  }
  return val;
}

export function LiquidGlassSegmented({
  options,
  value,
  onChange,
  ariaLabel = "Segmented control",
  className = "",
  variant = "surface",
  height = 40,
}: LiquidGlassSegmentedProps) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.id === value)
  );

  /* ── Dark mode reactivo via MutationObserver na classe do <html> ── */
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      document.documentElement.dataset.theme === "dark")
  );
  useEffect(() => {
    const update = () =>
      setIsDark(
        document.documentElement.classList.contains("dark") ||
          document.documentElement.dataset.theme === "dark"
      );
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => obs.disconnect();
  }, []);

  const barRef = useRef<HTMLDivElement>(null);
  const baseLayerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const restFillRef = useRef<HTMLDivElement>(null);
  const glassShellRef = useRef<HTMLDivElement>(null);
  const blueLayerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    w: 60,
    vw: 0,
    targetW: 60,
    lift: 0,
    vLift: 0,
    targetLift: 0,
    dragging: false,
    initialized: false,
    barWidth: 0,
    barHeight: height,
    slots: [] as { center: number; width: number }[],
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

  const measureGeometry = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return null;

    const barWidth = bar.clientWidth;
    const barHeight = bar.clientHeight || height;
    const slots = options.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return { center: 0, width: 0 };
      const w = el.offsetWidth;
      const center = el.offsetLeft + w / 2;
      return { center, width: w };
    });

    return { barWidth, barHeight, slots };
  }, [options, height]);

  const applyDOM = useCallback(
    (centerX: number, slotW: number, vx: number, lift: number) => {
      const p = physicsRef.current;
      const lens = lensRef.current;
      const baseLayer = baseLayerRef.current;
      const restFill = restFillRef.current;
      const glassShell = glassShellRef.current;
      const blueLayer = blueLayerRef.current;

      if (!slotW || !p.barWidth || !lens) return;

      const W = p.barWidth;
      const H = p.barHeight;
      const clampedLift = Math.max(0, Math.min(1.18, lift));
      const visualLift = Math.max(0, Math.min(1, lift));

      const restW = slotW;
      const restH = H - 8;

      const liftedW = slotW + 16;
      const liftedH = H + 12;

      const speed = p.reducedMotion ? 0 : Math.abs(vx);
      const velNorm = Math.min(1, speed / 950);
      const velStretchX = 1 + velNorm * 0.24 * visualLift;
      const velSquashY = 1 - velNorm * 0.12 * visualLift;

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
        const mag = p.reducedMotion ? 1 : 1 + 0.12 * visualLift;
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
    },
    []
  );

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const prev = lastTimeRef.current ?? now;
      const dt = Math.min(0.032, Math.max(0.001, (now - prev) / 1000));
      lastTimeRef.current = now;

      const p = physicsRef.current;

      const posStiffness = p.dragging ? 540 : 300;
      const posDamping = p.dragging ? 31 : 22;

      const ax = (p.targetX - p.x) * posStiffness - p.vx * posDamping;
      p.vx += ax * dt;
      p.x += p.vx * dt;

      const aw = (p.targetW - p.w) * 320 - p.vw * 24;
      p.vw += aw * dt;
      p.w += p.vw * dt;

      const liftStiffness = p.targetLift > p.lift ? 420 : 280;
      const liftDamping = p.targetLift > p.lift ? 23 : 22;

      const aLift =
        (p.targetLift - p.lift) * liftStiffness - p.vLift * liftDamping;
      p.vLift += aLift * dt;
      p.lift += p.vLift * dt;
      if (p.lift < 0) p.lift = 0;

      applyDOM(p.x, p.w, p.vx, p.lift);

      const settled =
        !p.dragging &&
        Math.abs(p.targetX - p.x) < 0.06 &&
        Math.abs(p.vx) < 0.35 &&
        Math.abs(p.targetW - p.w) < 0.08 &&
        Math.abs(p.targetLift - p.lift) < 0.002 &&
        Math.abs(p.vLift) < 0.015;

      if (settled) {
        p.x = p.targetX;
        p.vx = 0;
        p.w = p.targetW;
        p.vw = 0;
        p.lift = p.targetLift;
        p.vLift = 0;
        applyDOM(p.x, p.w, 0, p.lift);
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
      if (!geo || !geo.barWidth) return;

      const p = physicsRef.current;
      p.barWidth = geo.barWidth;
      p.barHeight = geo.barHeight;
      p.slots = geo.slots;

      const activeSlot = geo.slots[activeIndex];
      if (!activeSlot || !activeSlot.width) return;

      if (!p.initialized) {
        p.x = activeSlot.center;
        p.targetX = activeSlot.center;
        p.w = activeSlot.width;
        p.targetW = activeSlot.width;
        p.initialized = true;
        applyDOM(activeSlot.center, activeSlot.width, 0, p.lift);
      } else if (!p.dragging) {
        p.targetX = activeSlot.center;
        p.targetW = activeSlot.width;
        startLoop();
      }
    };

    syncLayout();
    const ro = new ResizeObserver(syncLayout);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [activeIndex, options.length, applyDOM, measureGeometry, startLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const findNearestIndex = (x: number) => {
    const slots = physicsRef.current.slots;
    if (!slots.length) return 0;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const d = Math.abs(x - slots[i].center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const commitIndex = (index: number, withFlight = false) => {
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    const targetOption = options[clamped];
    if (!targetOption) return;

    const p = physicsRef.current;
    const slot = p.slots[clamped];
    if (slot) {
      p.targetX = slot.center;
      p.targetW = slot.width;
    }

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
      }, 190);
    }

    onChange(targetOption.id);
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
      p.slots = geo.slots;
    }

    const rect = bar.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const touchedIdx = findNearestIndex(localX);
    const slot = p.slots[touchedIdx];
    const exactCenter = slot?.center ?? localX;

    p.dragging = true;
    p.targetLift = 1;
    p.targetX = exactCenter;
    if (slot) p.targetW = slot.width;

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
    if (!p.dragging || !p.slots.length) return;

    const deltaX = e.clientX - gestureRef.current.downX;
    if (!gestureRef.current.didDrag) {
      if (Math.abs(deltaX) <= 3) return;
      gestureRef.current.didDrag = true;
    }

    const minX = p.slots[0].center;
    const maxX = p.slots[p.slots.length - 1].center;
    const nextX = gestureRef.current.startCenterX + deltaX;
    p.targetX = rubberBandClamp(nextX, minX, maxX, 10);

    const nearest = findNearestIndex(p.targetX);
    if (p.slots[nearest]) {
      p.targetW = p.slots[nearest].width;
    }

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
    const targetIdx = findNearestIndex(projectedX);

    if (isQuickTap) {
      commitIndex(targetIdx, true);
    } else {
      p.targetLift = 0;
      commitIndex(targetIdx, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      commitIndex((activeIndex + 1) % options.length, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      commitIndex((activeIndex - 1 + options.length) % options.length, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      commitIndex(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      commitIndex(options.length - 1, true);
    }
  };

  const renderOptions = (isBlueLayer: boolean) =>
    options.map((opt, idx) => (
      <div
        key={opt.id}
        ref={
          !isBlueLayer
            ? (el) => {
                itemRefs.current[idx] = el;
              }
            : undefined
        }
        role={!isBlueLayer ? "tab" : undefined}
        aria-selected={!isBlueLayer ? idx === activeIndex : undefined}
        className={`relative flex h-full shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold tracking-[-0.01em] ${
          isBlueLayer
            ? "text-[#007AFF] dark:text-[#60A5FA]"
            : "text-zinc-950 dark:text-zinc-100"
        }`}
      >
        <span>{opt.label}</span>
        {opt.dot && (
          <span
            aria-hidden="true"
            className="absolute top-[5px] right-[6px] h-[4.5px] w-[4.5px] rounded-full bg-[#007AFF] dark:bg-[#60A5FA] shadow-[0_0_6px_rgba(0,122,255,0.65)]"
          />
        )}
      </div>
    ));

  /* ── Material de Vidro fiel ao 21st.dev LiquidGlassTabBar (Light + Dark Fosco) ── */
  const surfaceStyle: React.CSSProperties =
    variant === "surface"
      ? isDark
        ? {
            background: "rgba(28, 28, 32, 0.84)",
            backdropFilter: "blur(24px) saturate(140%) brightness(0.92)",
            WebkitBackdropFilter: "blur(24px) saturate(140%) brightness(0.92)",
            boxShadow: [
              "0 14px 36px -10px rgba(0, 0, 0, 0.58)",
              "0 2px 8px rgba(0, 0, 0, 0.30)",
              "inset 0 1.5px 1.5px rgba(255, 255, 255, 0.16)",
              "inset 0 -1.5px 2px rgba(255, 255, 255, 0.05)",
              "0 0 0 1px rgba(255, 255, 255, 0.12)",
            ].join(", "),
          }
        : {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.50) 55%, rgba(255,255,255,0.58) 100%)",
            backdropFilter: "blur(24px) saturate(1.85)",
            WebkitBackdropFilter: "blur(24px) saturate(1.85)",
            boxShadow: [
              "0 14px 36px -10px rgba(0, 0, 0, 0.22)",
              "0 2px 8px rgba(0, 0, 0, 0.08)",
              "inset 0 1.5px 1.5px rgba(255, 255, 255, 0.94)",
              "inset 0 -1.5px 2px rgba(255, 255, 255, 0.65)",
              "0 0 0 1px rgba(0, 0, 0, 0.06)",
            ].join(", "),
          }
      : {};

  return (
    <div className={`relative inline-flex select-none ${className}`}>
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
        style={{ height, ...surfaceStyle }}
        className="relative inline-flex cursor-grab touch-none items-center rounded-full px-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] active:cursor-grabbing"
      >
        {/* Reflexo especular simétrico na borda da barra (21st.dev) */}
        {variant === "surface" && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full opacity-50"
            style={{
              padding: "1.5px",
              background: isDark
                ? "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.16) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.85) 100%)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        )}

        {/* Camada 1: Texto base (recortado pela silhueta exata da bolha) */}
        <div
          ref={baseLayerRef}
          className="pointer-events-none relative z-10 flex h-full items-center py-[4px]"
        >
          {renderOptions(false)}
        </div>

        {/* Camada 2: Gota única Liquid Glass */}
        <div
          ref={lensRef}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="pointer-events-none absolute top-0 left-0 z-20 overflow-hidden rounded-full will-change-transform"
        >
          {/* Preenchimento discreto de repouso (21st.dev: vidro sutil, não branco chapado) */}
          <div
            ref={restFillRef}
            className="absolute inset-0 rounded-full"
            style={
              isDark
                ? {
                    backgroundColor: "rgba(255, 255, 255, 0.14)",
                    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.25)",
                  }
                : {
                    backgroundColor: "rgba(0, 0, 0, 0.068)",
                    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.55)",
                  }
            }
          />

          {/* Camada azul ampliada centralizada na gota */}
          <div
            ref={blueLayerRef}
            style={{ transformOrigin: "0 0" }}
            className="pointer-events-none absolute top-0 left-0 flex items-center px-[4px] py-[4px] will-change-transform"
          >
            {renderOptions(true)}
          </div>

          {/* Casca óptica Liquid Glass com borda 100% simétrica */}
          <div
            ref={glassShellRef}
            className="lg-tab-bar-shell absolute inset-0 rounded-full opacity-0"
          >
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

export default LiquidGlassSegmented;
