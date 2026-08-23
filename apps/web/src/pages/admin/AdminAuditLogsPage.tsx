import React, { useEffect, useState } from 'react';
import { auditApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatDate } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  ipAddress?: string;
  user?: { fullName?: string };
}

export const AdminAuditLogsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    auditApi.getAll({ page, limit: 15 }).then((res) => {
      setLogs(res.items);
      setTotalPages(res.totalPages);
      setIsLoading(false);
    });
  }, [page]);

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'سجل العمليات والتدقيق (Audit Trail)' : 'Administrative Audit Trail'}
        description={
          isArabic
            ? 'سجل كامل للعمليات والتعديلات الإدارية لضمان الأمان والامتثال'
            : 'Immutable historical ledger of system mutations and events'
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading audit logs...'} />
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'الوقت' : 'Timestamp'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'العملية' : 'Action'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الكيان' : 'Entity'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'المستخدم' : 'User'}</th>
                <th className="p-3.5 text-start">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-3.5 text-zinc-500">{formatDate(log.createdAt, isArabic)}</td>
                  <td className="p-3.5">
                    <Badge variant="secondary" className="font-mono">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-bold">{log.entity}</td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-300">
                    {log.user?.fullName || 'System'}
                  </td>
                  <td className="p-3.5 text-zinc-400 font-mono">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};
