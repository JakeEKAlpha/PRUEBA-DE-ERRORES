import React from 'react';

interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  label: string;
  external?: boolean;
  showVisitedBadge?: boolean;
}

export const AppLink: React.FC<AppLinkProps> = ({
  label,
  external = false,
  showVisitedBadge = false,
  className = '',
  target,
  rel,
  ...rest
}) => {
  const safeTarget = external ? '_blank' : target;
  const safeRel = external ? 'noopener noreferrer' : rel;

  return (
    <a
      target={safeTarget}
      rel={safeRel}
      className={`v2-link inline-flex items-center gap-1 text-sm font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] focus-visible:ring-offset-1 transition-colors ${className}`}
      {...rest}
    >
      <span>{label}</span>
      {external && (
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          open_in_new
        </span>
      )}
      {showVisitedBadge && (
        <span className="sr-only">(enlace navegable con estado visitado diferenciado)</span>
      )}
    </a>
  );
};
