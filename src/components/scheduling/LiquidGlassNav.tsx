import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@/styles/liquid-glass-nav.css';

export type SchedulingTab = 'weekly' | 'my_reservations' | 'monthly';

interface LiquidGlassNavProps {
  activeTab: SchedulingTab;
  onTabChange: (tab: SchedulingTab) => void;
  badgeCount?: number;
  variant?: 'glass' | 'glass-brutal';
}

const TABS: { id: SchedulingTab; label: string; icon: 'calendar' | 'bookmark' | 'grid' }[] = [
  { id: 'weekly', label: 'Semanal', icon: 'calendar' },
  { id: 'my_reservations', label: 'Reservas', icon: 'bookmark' },
  { id: 'monthly', label: 'Visão Geral', icon: 'grid' },
];

export const LiquidGlassNav: React.FC<LiquidGlassNavProps> = ({
  activeTab,
  onTabChange,
  badgeCount = 0,
  variant = 'glass',
}) => {
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  const [isMini, setIsMini] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Pointer drag state
  const dragRef = useRef<{
    isDown: boolean;
    hasDragged: boolean;
    startX: number;
    startLeft: number;
    currentX: number;
    itemWidth: number;
    maxLeft: number;
    pointerId: number | null;
  }>({
    isDown: false,
    hasDragged: false,
    startX: 0,
    startLeft: 0,
    currentX: 0,
    itemWidth: 0,
    maxLeft: 0,
    pointerId: null,
  });

  // Haptic feedback safely
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Ignore unsupported browsers
    }
  }, []);

  // Update pill position
  const updatePillPosition = useCallback((index: number, immediate = false) => {
    if (!navRef.current || !pillRef.current) return;
    const navWidth = navRef.current.clientWidth;
    const padding = 5;
    const availableWidth = navWidth - padding * 2;
    const itemWidth = availableWidth / TABS.length;
    const targetX = index * itemWidth;

    if (immediate) {
      pillRef.current.style.transition = 'none';
    } else {
      pillRef.current.style.transition = '';
    }

    pillRef.current.style.transform = `translateX(${targetX}px)`;
  }, []);

  // Sync pill with activeIndex on prop change or resize
  useEffect(() => {
    updatePillPosition(activeIndex);
  }, [activeIndex, updatePillPosition]);

  useEffect(() => {
    const handleResize = () => {
      updatePillPosition(activeIndexRef.current, true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePillPosition]);

  // Scroll handler for auto-shrink (.mini)
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      if (currentScrollY > 60 && diff > 8) {
        setIsMini(true);
      } else if (diff < -8 || currentScrollY < 40) {
        setIsMini(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle pointer down (tap or start drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const navWidth = navRef.current.clientWidth;
    const padding = 5;
    const itemWidth = (navWidth - padding * 2) / TABS.length;

    dragRef.current = {
      isDown: true,
      hasDragged: false,
      startX: e.clientX,
      startLeft: activeIndexRef.current * itemWidth,
      currentX: e.clientX,
      itemWidth,
      maxLeft: itemWidth * (TABS.length - 1),
      pointerId: e.pointerId,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if setPointerCapture fails
    }

    setIsPressing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d.isDown || !pillRef.current) return;

    const deltaX = e.clientX - d.startX;
    if (Math.abs(deltaX) > 4) {
      if (!d.hasDragged) {
        d.hasDragged = true;
        setIsDragging(true);
      }
      let targetLeft = d.startLeft + deltaX;
      // Clamp with soft rubber band
      if (targetLeft < 0) {
        targetLeft = targetLeft * 0.3;
      } else if (targetLeft > d.maxLeft) {
        targetLeft = d.maxLeft + (targetLeft - d.maxLeft) * 0.3;
      }
      pillRef.current.style.transform = `translateX(${targetLeft}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d.isDown) return;

    setIsPressing(false);
    setIsDragging(false);
    d.isDown = false;

    if (d.pointerId !== null) {
      try {
        e.currentTarget.releasePointerCapture(d.pointerId);
      } catch {
        // Ignore
      }
    }

    if (d.hasDragged) {
      // Snapping based on drag position
      const deltaX = e.clientX - d.startX;
      const finalLeft = d.startLeft + deltaX;
      let targetIndex = Math.round(finalLeft / d.itemWidth);
      targetIndex = Math.max(0, Math.min(TABS.length - 1, targetIndex));

      if (targetIndex !== activeIndexRef.current) {
        triggerHaptic();
        onTabChange(TABS[targetIndex].id);
      } else {
        updatePillPosition(activeIndexRef.current);
      }
    }
  };

  const handleTabClick = (tabId: SchedulingTab, index: number) => {
    if (dragRef.current.hasDragged) return;
    if (tabId !== activeTab) {
      triggerHaptic();
      onTabChange(tabId);
    }
  };

  return (
    <nav
      ref={navRef}
      className={`nav ${variant} ${isMini ? 'mini' : ''}`}
      aria-label="Navegação principal"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Pílula Deslizante */}
      <span
        ref={pillRef}
        className={`pill ${isDragging ? 'drag' : ''} ${isPressing ? 'press' : ''}`}
        aria-hidden="true"
      />

      {/* Botões de Navegação */}
      {TABS.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`item ${isActive ? 'on' : ''}`}
            onClick={() => handleTabClick(tab.id, idx)}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Ícone */}
            {tab.icon === 'calendar' && (
              <svg viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}

            {tab.icon === 'bookmark' && (
              <>
                <svg viewBox="0 0 24 24">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {badgeCount > 0 && <span className="badge">{badgeCount}</span>}
              </>
            )}

            {tab.icon === 'grid' && (
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            )}

            {/* Rótulo */}
            <span className="lbl">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

