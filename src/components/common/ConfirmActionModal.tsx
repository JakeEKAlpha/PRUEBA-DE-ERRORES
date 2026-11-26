import React from 'react';
import { AccessibleModal } from './AccessibleModal';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen, title, description, confirmLabel, variant = 'primary', onConfirm, onClose,
}) => (
  <AccessibleModal
    isOpen={isOpen}
    titleId="confirm-action-title"
    onClose={onClose}
    className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202020] p-6 shadow-2xl"
  >
    <h2 id="confirm-action-title" className="text-h3 [text-wrap:balance]">{title}</h2>
    <p className="mt-2 text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">{description}</p>
    <div className="mt-5 flex justify-end gap-2">
      <button type="button" onClick={onClose} className="px-4 py-2.5 min-h-[40px] rounded-xl border text-sm font-semibold">Cancelar</button>
      <button
        type="button"
        onClick={() => { onConfirm(); onClose(); }}
        className={`px-4 py-2.5 min-h-[40px] rounded-xl text-sm font-bold text-white ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#308C50] hover:bg-[#256d3e]'}`}
      >
        {confirmLabel}
      </button>
    </div>
  </AccessibleModal>
);
