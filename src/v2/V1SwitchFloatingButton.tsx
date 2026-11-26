import React from 'react';
import type { UiVersionMode } from './useUiMode';

interface V1SwitchFloatingButtonProps {
  onSwitch: (mode: UiVersionMode) => void;
}

export const V1SwitchFloatingButton: React.FC<V1SwitchFloatingButtonProps> = ({ onSwitch }) => (
  <button
    type="button"
    onClick={() => onSwitch('v2')}
    aria-label="Cambiar a vista paralela v2"
    className="fixed bottom-20 md:bottom-6 left-4 z-40 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#308C50] hover:bg-[#267340] text-white text-sm font-semibold shadow-lg transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
  >
    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
      layers
    </span>
    <span>Ver v2</span>
  </button>
);
