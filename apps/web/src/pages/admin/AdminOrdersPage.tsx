import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types/index.js';
import { ordersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Select } from '../../components/common/Select.js';
import { Input } from '../../components/common/Input.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Eye } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    ordersApi
      .getAll({
        page,
        limit: 12,
        status: (status as OrderStatus) || undefined,
        search: search || undefined,
      })
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [page, status, search]);

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'طلبات العملاء ومتابعة الشحن' : 'Customer Orders'}
        description={
          isArabic
            ? 'متابعة دورة حياة الطلبات وحالات الشحن والتواصل مع العملاء'
            : 'Track order lifecycles and customer WhatsApp follow-ups'
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-64">
          <Input
            placeholder={
              isArabic ? 'بحث برقم الطلب أو اسم العميل...' : 'Search order number, name...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: isArabic ? 'جميع الحالات' : 'All Statuses' },
              { value: 'PENDING', label: 'PENDING' },
              { value: 'CONTACTED', label: 'CONTACTED' },
              { value: 'CONFIRMED', label: 'CONFIRMED' },
              { value: 'PROCESSING', label: 'PROCESSING' },
              { value: 'COMPLETED', label: 'COMPLETED' },
              { value: 'CANCELLED', label: 'CANCELLED' },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading orders...'} />
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'رقم الطلب' : 'Order #'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'العميل' : 'Customer'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الإجمالي' : 'Total'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'التاريخ' : 'Date'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-end">{isArabic ? 'تفاصيل' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-3.5 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {o.orderNumber}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {o.customerName}
                    </p>
                    <p className="text-[11px] text-zinc-500" dir="ltr">
                      {o.customerPhone}
                    </p>
                  </td>
                  <td className="p-3.5 font-black">
                    {formatPrice(Number(o.totalAmount), 'EGP', isArabic)}
                  </td>
                  <td className="p-3.5 text-zinc-500">{formatDate(o.createdAt, isArabic)}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        o.status === 'COMPLETED'
                          ? 'success'
                          : o.status === 'PENDING'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-end">
                    <Link to={`/admin/orders/${o.id}`}>
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
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
