import React, { useEffect, useRef } from 'react';

interface AccessibleModalProps {
  isOpen: boolean;
  titleId: string;
  onClose: () => void;
  disableEscape?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  titleId,
  onClose,
  disableEscape = false,
  children,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const escape = (event: KeyboardEvent) => {
      if (!disableEscape && event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', escape);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', escape);
      previous?.focus();
    };
  }, [isOpen, disableEscape, onClose]);
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div ref={panelRef} tabIndex={-1} className={className}>{children}</div>
    </div>
  );
};
