import React, { useEffect, useState, useCallback } from 'react';
import { auditApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatDate } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Trash2,
  RefreshCw,
  Search,
  ShieldCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AuditLog } from '../../types/index.js';

export const AdminAuditLogsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.getAll({
        page,
        limit: 15,
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        search: search.trim() || undefined,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages);
      setTotalLogs(res.total);
    } catch {
      // API error handling
    } finally {
      setIsLoading(false);
    }
  }, [page, entityFilter, actionFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    try {
      setIsClearing(true);
      await auditApi.clearAll();
      setShowClearModal(false);
      setFeedbackMsg({
        type: 'success',
        text: isArabic ? 'تم تفريغ ومسح سجل العمليات بالكامل بنجاح!' : 'Audit logs cleared successfully!',
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
      setPage(1);
      fetchLogs();
    } catch {
      setFeedbackMsg({
        type: 'error',
        text: isArabic ? 'فشل مسح سجل العمليات' : 'Failed to clear audit logs',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATE') || action.includes('RESTORE')) return 'success';
    if (action.includes('DELETE') || action.includes('RESET')) return 'danger';
    if (action.includes('UPDATE') || action.includes('STATUS')) return 'warning';
    return 'secondary';
  };

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'سجل العمليات والتدقيق (Audit Trail)' : 'Administrative Audit Trail'}
        description={
          isArabic
            ? 'سجل حي لكافة العمليات الإدارية، التعديلات، وتغييرات الأسعار والمخزون والإعدادات'
            : 'Real-time ledger of administrative mutations, inventory changes, and system events'
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              isLoading={isLoading}
              title={isArabic ? 'تحديث السجل' : 'Refresh Logs'}
            >
              <RefreshCw className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
              <span>{isArabic ? 'تحديث' : 'Refresh'}</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowClearModal(true)}
              disabled={logs.length === 0 && totalLogs === 0}
            >
              <Trash2 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'مسح السجل' : 'Clear Logs'}</span>
            </Button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute top-3 left-3 rtl:right-3 rtl:left-auto text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={isArabic ? 'بحث باسم المستخدم، الكيان، IP، أو تفاصيل العملية...' : 'Search by user, entity, IP, or details...'}
              className="w-full pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none"
            >
              <option value="">{isArabic ? 'جميع الكيانات (Entity)' : 'All Entities'}</option>
              <option value="PRODUCT">{isArabic ? 'المنتجات (PRODUCT)' : 'Products'}</option>
              <option value="ORDER">{isArabic ? 'الطلبات (ORDER)' : 'Orders'}</option>
              <option value="CATEGORY">{isArabic ? 'الأقسام (CATEGORY)' : 'Categories'}</option>
              <option value="SETTINGS">{isArabic ? 'الإعدادات (SETTINGS)' : 'Settings'}</option>
              <option value="DISCOUNT">{isArabic ? 'الخصومات (DISCOUNT)' : 'Discounts'}</option>
              <option value="USER">{isArabic ? 'المستخدمين (USER)' : 'Users'}</option>
              <option value="MEDIA">{isArabic ? 'الوسائط (MEDIA)' : 'Media'}</option>
              <option value="CMS">{isArabic ? 'الـ CMS' : 'CMS'}</option>
              <option value="AUTH">{isArabic ? 'تسجيل الدخول (AUTH)' : 'Auth'}</option>
              <option value="SYSTEM">{isArabic ? 'النظام والنسخ الاحتياطي (SYSTEM)' : 'System'}</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 outline-none"
            >
              <option value="">{isArabic ? 'جميع العمليات (Action)' : 'All Actions'}</option>
              <option value="CREATE">{isArabic ? 'إنشاء (CREATE)' : 'Create'}</option>
              <option value="UPDATE">{isArabic ? 'تعديل (UPDATE)' : 'Update'}</option>
              <option value="DELETE">{isArabic ? 'حذف (DELETE)' : 'Delete'}</option>
              <option value="UPDATE_STATUS">{isArabic ? 'تغيير حالة (UPDATE_STATUS)' : 'Update Status'}</option>
              <option value="USER_LOGIN">{isArabic ? 'تسجيل دخول (LOGIN)' : 'Login'}</option>
              <option value="RESTORE_BACKUP">{isArabic ? 'استعادة نسخة (RESTORE)' : 'Restore Backup'}</option>
              <option value="RESET_DEFAULTS">{isArabic ? 'ضبط مصنع (RESET)' : 'Reset Defaults'}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table Card */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري تحميل السجلات...' : 'Loading audit logs...'} />
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title={isArabic ? 'لا توجد سجلات مطابقة' : 'No Audit Logs Found'}
              message={
                isArabic
                  ? 'لم يتم تسجيل أي عمليات بعد أو لا توجد نتائج مطابقة لخيارات الفلترة الحالية.'
                  : 'No administrative actions have been logged yet matching your filters.'
              }
              icon={<ShieldCheck className="w-12 h-12 text-zinc-400" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 text-start">{isArabic ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'العملية' : 'Action'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'الكيان' : 'Entity'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'تفاصيل العملية' : 'Details'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'المسؤول' : 'User'}</th>
                  <th className="p-3.5 text-start">IP</th>
                  <th className="p-3.5 text-center">{isArabic ? 'عرض' : 'View'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="p-3.5 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                      {formatDate(log.createdAt, isArabic)}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={getActionBadgeVariant(log.action)} className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-bold whitespace-nowrap">{log.entity}</td>
                    <td className="p-3.5 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                      {log.details || `#${log.entityId}`}
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {log.user?.fullName || log.user?.email || 'System / النظام'}
                    </td>
                    <td className="p-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        title={isArabic ? 'عرض التفاصيل الكاملة' : 'View Payload Details'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Clear Logs Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title={isArabic ? 'تأكيد مسح سجل العمليات' : 'Confirm Clear Audit Logs'}
      >
        <div className="space-y-4 text-start">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {isArabic
                ? 'هل أنت متأكد من رغبتك في مسح وتفريغ سجل العمليات والتدقيق بالكامل؟ لن تتمكن من استرجاع السجلات المحذوفة.'
                : 'Are you sure you want to clear the entire audit trail? This action cannot be undone.'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowClearModal(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isClearing}
              onClick={handleClearLogs}
            >
              <Trash2 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'نعم، مسح السجل الآن' : 'Yes, Clear All Logs'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={isArabic ? 'تفاصيل سجل العملية' : 'Audit Log Record Details'}
        >
          <div className="space-y-3 text-start text-xs">
            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">{isArabic ? 'العملية' : 'Action'}</span>
                <span className="font-bold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">{isArabic ? 'الكيان' : 'Entity'}</span>
                <span className="font-bold">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">{isArabic ? 'المسؤول' : 'User'}</span>
                <span>{selectedLog.user?.fullName || 'System'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">IP Address</span>
                <span className="font-mono">{selectedLog.ipAddress || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">{isArabic ? 'التوقيت' : 'Timestamp'}</span>
                <span>{formatDate(selectedLog.createdAt, isArabic)}</span>
              </div>
            </div>

            {selectedLog.details && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">{isArabic ? 'الوصف' : 'Description'}</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{selectedLog.details}</p>
              </div>
            )}

            {selectedLog.payload && (
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Payload (JSON)</span>
                <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-tight max-h-48">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedLog(null)}>
                {isArabic ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
