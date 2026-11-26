import React from 'react';

export type BrandLogoSurface = 'auto' | 'light' | 'dark' | 'green';

interface BrandLogoProps {
  className?: string;
  isDark?: boolean;
  surface?: BrandLogoSurface;
}

export function resolveBrandLogoColorClass(
  surface: BrandLogoSurface = 'auto',
  isDark?: boolean
): string {
  if (surface === 'green') return 'text-white';
  if (surface === 'dark') return 'text-[#F2EFDF]';
  if (surface === 'light') return 'text-[#308C50]';
  if (isDark === true) return 'text-[#F2EFDF]';
  if (isDark === false) return 'text-[#308C50]';
  return 'text-[#308C50] dark:text-[#F2EFDF]';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-9',
  isDark,
  surface = 'auto',
}) => (
  <svg
    viewBox="0 0 52 37"
    fill="currentColor"
    role="img"
    aria-label="Alpha Digital"
    className={`${className} w-auto shrink-0 transition-colors ${resolveBrandLogoColorClass(surface, isDark)}`}
  >
    <path d="M29.842 0.759L24.587 0.748L1.378 35.608L6.533 35.695L24.530 8.894L24.646 31.291L29.867 31.225Z" />
    <path d="M41.391 19.229C41.953 19.335 42.771 19.662 43.497 20.070C45.340 21.107 46.478 23.081 46.488 25.257C46.502 28.480 44.230 30.915 40.733 31.426C40.020 31.530 38.016 31.522 37.909 31.414L37.807 20.535L32.653 20.591L32.699 35.618L37.259 35.584C42.218 35.546 42.181 35.550 43.866 34.974C47.012 33.901 49.396 31.290 50.237 27.996C50.484 27.030 50.510 26.794 50.517 25.463C50.527 23.635 50.328 22.688 49.579 21.013C48.557 18.727 46.152 16.688 43.554 15.907L20.930 15.550L18.700 19.229Z" />
    <path d="M12.099 19.144L14.799 15.269L4.283 15.363L4.251 19.023Z" />
  </svg>
);
