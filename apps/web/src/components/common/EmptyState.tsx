import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../../utils/cn.js';

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
  className?: string;
}> = ({
  title = 'No items found',
  message,
  description,
  actionLabel,
  onAction,
  action,
  icon,
  className,
}) => {
  const displayMessage = message || description || 'There is no data to display at this moment.';
  const finalActionLabel = actionLabel || action?.label;
  const finalOnAction = onAction || action?.onClick;

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">{displayMessage}</p>
      {finalActionLabel && finalOnAction && (
        <Button variant="primary" size="sm" onClick={finalOnAction}>
          {finalActionLabel}
        </Button>
      )}
    </div>
  );
};
