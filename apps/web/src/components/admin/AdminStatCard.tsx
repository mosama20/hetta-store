import React from 'react';
import { Card } from '../common/Card.js';

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ title, value, icon, subtitle }) => {
  return (
    <Card className="p-5 flex items-center justify-between space-x-4 rtl:space-x-reverse text-start">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{value}</p>
        {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
      </div>
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
        {icon}
      </div>
    </Card>
  );
};
