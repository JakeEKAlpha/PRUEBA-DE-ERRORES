import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: string;
  shortcut?: string;
  placement?: TooltipPlacement;
  children: React.ReactNode;
  disabled?: boolean;
}

interface FloatingCoords {
  top: number;
  left: number;
  transform: string;
}

function computeTooltipCoords(rect: DOMRect, placement: TooltipPlacement): FloatingCoords {
  const gap = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (placement === 'right') {
    const left = Math.min(vw - 12, rect.right + gap);
    const top = Math.min(vh - 20, Math.max(20, rect.top + rect.height / 2));
    return { top, left, transform: 'translateY(-50%)' };
  }
  if (placement === 'left') {
    const left = Math.max(12, rect.left - gap);
    const top = Math.min(vh - 20, Math.max(20, rect.top + rect.height / 2));
    return { top, left, transform: 'translate(-100%, -50%)' };
  }
  if (placement === 'bottom') {
    const left = Math.min(vw - 24, Math.max(24, rect.left + rect.width / 2));
    const top = Math.min(vh - 16, rect.bottom + gap);
    return { top, left, transform: 'translateX(-50%)' };
  }

  const left = Math.min(vw - 24, Math.max(24, rect.left + rect.width / 2));
  const top = Math.max(16, rect.top - gap);
  return { top, left, transform: 'translate(-50%, -100%)' };
}

export const Tooltip: React.FC<TooltipProps> = ({
  label,
  shortcut,
  placement = 'top',
  children,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<FloatingCoords | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  const updateCoords = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords(computeTooltipCoords(rect, placement));
  }, [placement]);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open, updateCoords]);

  if (disabled) return <>{children}</>;

  const tooltipNode = open && coords && (
    <span
      id={tooltipId}
      role="tooltip"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: coords.transform,
      }}
      className="pointer-events-none z-[9999] whitespace-nowrap rounded-lg px-2.5 py-1 text-sm font-medium shadow-xl bg-neutral-900 text-white border border-neutral-800 dark:bg-[#2B2B2B] dark:text-[#FAFAFA] dark:border-[#525252] flex items-center gap-1.5"
    >
      <span>{label}</span>
      {shortcut && (
        <kbd className="font-data text-sm px-1.5 py-0.5 rounded bg-white/15 dark:bg-white/10">
          {shortcut}
        </kbd>
      )}
    </span>
  );

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => {
        updateCoords();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={(e) => {
        try {
          if (e.target instanceof HTMLElement && !e.target.matches(':focus-visible')) return;
        } catch {
          return;
        }
        updateCoords();
        setOpen(true);
      }}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      {tooltipNode && typeof document !== 'undefined' && document.body
        ? createPortal(tooltipNode, document.body)
        : tooltipNode}
    </span>
  );
};
