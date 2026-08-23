import React from 'react';

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4 text-start">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {action && <div className="flex items-center space-x-3 rtl:space-x-reverse">{action}</div>}
    </div>
  );
};
