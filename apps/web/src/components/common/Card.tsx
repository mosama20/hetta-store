import React from 'react';
import { cn } from '../../utils/cn.js';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
