import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [isMini, setIsMini] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Pointer drag tracking
  const dragRef = useRef<{
    isDown: boolean;
    hasDragged: boolean;
    startX: number;
    startLeft: number;
    itemWidth: number;
    maxLeft: number;
    pointerId: number | null;
  }>({
    isDown: false,
    hasDragged: false,
    startX: 0,
    startLeft: 0,
    itemWidth: 0,
    maxLeft: 0,
    pointerId: null,
  });

  // Client mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe Haptic feedback
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
    const targetX = Math.max(0, index) * itemWidth;

    if (immediate) {
      pillRef.current.style.transition = 'none';
    } else {
      pillRef.current.style.transition = '';
    }

    pillRef.current.style.transform = `translateX(${targetX}px)`;
  }, []);

  // Sync pill with activeIndex on prop change
  useEffect(() => {
    if (mounted) {
      updatePillPosition(activeIndex);
    }
  }, [mounted, activeIndex, updatePillPosition]);

  // Handle window resize
  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => {
      updatePillPosition(activeIndexRef.current, true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted, updatePillPosition]);

  // Scroll handler for auto-shrink (.lg-nav--mini)
  useEffect(() => {
    if (!mounted) return;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      if (currentScrollY > 160 && diff > 12) {
        setIsMini(true);
      } else if (diff < -8 || currentScrollY < 60) {
        setIsMini(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  // Handle tab selection
  const handleSelectTab = useCallback(
    (tabId: SchedulingTab) => {
      triggerHaptic();
      onTabChange(tabId);
    },
    [triggerHaptic, onTabChange]
  );

  // Pointer Down on Nav
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const navWidth = navRef.current.clientWidth;
    const padding = 5;
    const itemWidth = (navWidth - padding * 2) / TABS.length;

    dragRef.current = {
      isDown: true,
      hasDragged: false,
      startX: e.clientX,
      startLeft: activeIndexRef.current * itemWidth,
      itemWidth,
      maxLeft: itemWidth * (TABS.length - 1),
      pointerId: e.pointerId,
    };

    setIsPressing(true);
  };

  // Pointer Move (only initiates drag when moved more than 8px)
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d.isDown || !pillRef.current) return;

    const deltaX = e.clientX - d.startX;
    if (Math.abs(deltaX) > 8) {
      if (!d.hasDragged) {
        d.hasDragged = true;
        setIsDragging(true);
        try {
          if (d.pointerId !== null) {
            e.currentTarget.setPointerCapture(d.pointerId);
          }
        } catch {
          // Ignore
        }
      }

      let targetLeft = d.startLeft + deltaX;
      // Elastic rubber band at boundaries
      if (targetLeft < 0) {
        targetLeft = targetLeft * 0.25;
      } else if (targetLeft > d.maxLeft) {
        targetLeft = d.maxLeft + (targetLeft - d.maxLeft) * 0.25;
      }
      pillRef.current.style.transform = `translateX(${targetLeft}px)`;
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d.isDown) return;

    const wasDragged = d.hasDragged;
    const pointerId = d.pointerId;
    const startX = d.startX;
    const startLeft = d.startLeft;
    const itemWidth = d.itemWidth;

    setIsPressing(false);
    setIsDragging(false);
    d.isDown = false;
    d.hasDragged = false;

    if (pointerId !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerId);
      } catch {
        // Ignore
      }
    }

    if (wasDragged) {
      const deltaX = e.clientX - startX;
      const finalLeft = startLeft + deltaX;
      let targetIndex = Math.round(finalLeft / itemWidth);
      targetIndex = Math.max(0, Math.min(TABS.length - 1, targetIndex));

      if (targetIndex !== activeIndexRef.current) {
        handleSelectTab(TABS[targetIndex].id);
      } else {
        updatePillPosition(activeIndexRef.current);
      }
    }
  };

  if (!mounted) return null;

  const variantClass = variant === 'glass-brutal' ? 'lg-nav--brutal' : 'lg-nav--glass';

  const navContent = (
    <nav
      ref={navRef}
      className={`lg-nav ${variantClass} ${isMini ? 'lg-nav--mini' : ''}`}
      aria-label="Navegação principal de agendamento"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Pílula Deslizante Luminous Glass */}
      <span
        ref={pillRef}
        className={`lg-nav__pill ${isDragging ? 'lg-nav__pill--drag' : ''} ${
          isPressing ? 'lg-nav__pill--press' : ''
        }`}
        aria-hidden="true"
      />

      {/* Botões de Navegação */}
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`lg-nav__item ${isActive ? 'lg-nav__item--on' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelectTab(tab.id);
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="lg-nav__icon">
              {/* Semanal - Calendário */}
              {tab.icon === 'calendar' && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )}

              {/* Reservas - Bookmark */}
              {tab.icon === 'bookmark' && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}

              {/* Visão Geral - Grid 2x2 */}
              {tab.icon === 'grid' && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              )}
            </div>

            {/* Rótulo da Aba */}
            <span className="lg-nav__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return createPortal(navContent, document.body);
};
