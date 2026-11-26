import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface AccessibleModalProps {
  isOpen: boolean;
  titleId: string;
  onClose: () => void;
  disableEscape?: boolean;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  titleId,
  onClose,
  disableEscape = false,
  children,
  className = '',
  overlayClassName = 'z-50 items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const raf = requestAnimationFrame(() => {
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const firstInput = focusables.find((el) => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName));
      (firstInput || panel).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!disableEscape && event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && panel) {
        const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (focusables.length === 0) {
          event.preventDefault();
          panel.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [isOpen, disableEscape, onClose]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`fixed inset-0 flex backdrop-blur-xs ${overlayClassName}`}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`outline-none surface-card ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
