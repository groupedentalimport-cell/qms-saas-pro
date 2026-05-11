import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  ariaLabel?: string;
}

export function ResponsiveTable({ children, ariaLabel = 'Data table' }: ResponsiveTableProps) {
  return (
    <div 
      className="overflow-x-auto -mx-6 px-6" 
      role="region" 
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
