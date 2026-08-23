import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading...',
  className,
}) => {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <Loader2 className="w-8 h-8 text-zinc-900 dark:text-zinc-100 animate-spin mb-3" />
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
};
