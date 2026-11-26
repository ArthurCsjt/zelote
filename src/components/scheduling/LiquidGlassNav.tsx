import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LiquidGlassTabBar, type LiquidGlassTabItem } from '@/components/ui/liquid-glass-tab-bar';
import '@/styles/liquid-glass-nav.css';

export type SchedulingTab = 'weekly' | 'my_reservations' | 'monthly';

interface LiquidGlassNavProps {
  activeTab: SchedulingTab;
  onTabChange: (tab: SchedulingTab) => void;
  badgeCount?: number;
  variant?: 'glass' | 'glass-brutal';
}

/* Ícones preenchidos autorais no estilo Apple SF Symbols para a barra Liquid Glass */
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <path d="M7.5 2.5a1 1 0 0 1 1 1V5h7V3.5a1 1 0 1 1 2 0V5h.75A3.25 3.25 0 0 1 21.5 8.25v10A3.25 3.25 0 0 1 18.25 21.5H5.75A3.25 3.25 0 0 1 2.5 18.25v-10A3.25 3.25 0 0 1 5.75 5H6.5V3.5a1 1 0 0 1 1-1Zm12 7.25h-15v8.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-8.5Z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <path d="M6.75 3.5h10.5A2.25 2.25 0 0 1 19.5 5.75v14.32a.85.85 0 0 1-1.36.68L12 16.15l-6.14 4.6a.85.85 0 0 1-1.36-.68V5.75A2.25 2.25 0 0 1 6.75 3.5Z" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="2" />
  </svg>
);

export const LiquidGlassNav: React.FC<LiquidGlassNavProps> = ({
  activeTab,
  onTabChange,
  badgeCount = 0,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Ignore unsupported browsers
    }
  }, []);

  const handleTabChange = useCallback(
    (id: string) => {
      triggerHaptic();
      onTabChange(id as SchedulingTab);
    },
    [triggerHaptic, onTabChange]
  );

  const items: LiquidGlassTabItem[] = useMemo(
    () => [
      { id: 'weekly', label: 'Semanal', icon: <CalendarIcon /> },
      { id: 'my_reservations', label: 'Minhas', icon: <BookmarkIcon />, badge: badgeCount },
      { id: 'monthly', label: 'Visão Geral', icon: <GridIcon /> },
    ],
    [badgeCount]
  );

  if (!mounted) return null;

  return createPortal(
    <div className="lg-nav-portal fixed left-0 right-0 bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-40 flex justify-center px-4 pointer-events-none">
      <LiquidGlassTabBar
        items={items}
        value={activeTab}
        onChange={handleTabChange}
        ariaLabel="Navegação principal de agendamento"
        className="max-w-[400px] pointer-events-auto"
      />
    </div>,
    document.body
  );
};
