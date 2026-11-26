import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface AnimatedContextIconProps {
  icon: string;
  iconKey?: string;
  className?: string;
  filled?: boolean;
  weight?: 'regular' | 'semibold';
  spin?: boolean;
}

export const AnimatedContextIcon: React.FC<AnimatedContextIconProps> = ({
  icon,
  iconKey,
  className = '',
  filled = false,
  weight = 'regular',
  spin = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const variantClass = [
    'material-symbols-outlined',
    filled ? 'icon-fill' : 'icon-outline',
    weight === 'semibold' ? 'icon-weight-semibold' : 'icon-weight-regular',
    spin ? 'animate-spin' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={iconKey ?? icon}
        aria-hidden="true"
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
        }
        animate={
          prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.12 }
            : { type: 'spring', duration: 0.3, bounce: 0 }
        }
        className={variantClass}
      >
        {icon}
      </motion.span>
    </AnimatePresence>
  );
};
