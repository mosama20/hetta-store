import React, { useEffect, useState } from 'react';
import { Discount } from '../../types/index.js';
import { discountsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized, formatDate } from '../../utils/formatters.js';
import { triggerStoreSync } from '../../store/settingsStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { Card } from '../../components/common/Card.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Plus, Trash2 } from 'lucide-react';

export const AdminDiscountsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [value, setValue] = useState(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const loadDiscounts = () => {
    setIsLoading(true);
    discountsApi
      .getAll(true)
      .then((data) => {
        setDiscounts(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await discountsApi.create({
      nameAr,
      nameEn,
      type,
      value: Number(value),
      startDate: new Date(startDate).toISOString(),
      applyToAll: true,
    });
    triggerStoreSync();
    setModalOpen(false);
    loadDiscounts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isArabic ? 'حذف هذا الخصم؟' : 'Delete discount?')) return;
    await discountsApi.delete(id);
    triggerStoreSync();
    loadDiscounts();
  };

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'العروض والحملات الترويجية' : 'Promotions & Discounts'}
        description={
          isArabic
            ? 'إدارة الخصومات المئوية والمبالغ الثابتة على مستوى المتجر'
            : 'Manage discount campaigns and pricing rules'
        }
        action={
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'إنشاء عرض جديد' : 'New Promotion'}</span>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading promotions...'} />
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'اسم الحملة' : 'Promotion Name'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'النوع والقيمة' : 'Type & Value'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'النطاق' : 'Scope'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'تاريخ البدء' : 'Start Date'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-end">{isArabic ? 'حذف' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                    {getLocalized(d.nameAr, d.nameEn, isArabic)}
                  </td>
                  <td className="p-3.5 font-black text-amber-600">
                    {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `${d.value} EGP`}
                  </td>
                  <td className="p-3.5 font-medium">
                    {d.applyToAll
                      ? isArabic
                        ? 'المتجر بالكامل'
                        : 'All Products'
                      : isArabic
                        ? 'مخصص'
                        : 'Custom'}
                  </td>
                  <td className="p-3.5 text-zinc-500">{formatDate(d.startDate, isArabic)}</td>
                  <td className="p-3.5">
                    <Badge variant={d.isActive ? 'success' : 'secondary'}>
                      {d.isActive ? (isArabic ? 'نشط' : 'Active') : isArabic ? 'معطل' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isArabic ? 'إنشاء حملة خصم' : 'New Promotion'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={isArabic ? 'اسم العرض بالعربية *' : 'Name (Arabic) *'}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
          <Input
            label={isArabic ? 'اسم العرض بالإنجليزية *' : 'Name (English) *'}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={isArabic ? 'نوع الخصم' : 'Discount Type'}
              value={type}
              onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
            >
              <option value="PERCENTAGE">{isArabic ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
              <option value="FIXED_AMOUNT">
                {isArabic ? 'مبلغ ثابت (ج.م)' : 'Fixed Amount (EGP)'}
              </option>
            </Select>
            <Input
              label={isArabic ? 'القيمة' : 'Value'}
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              required
            />
          </div>
          <Input
            label={isArabic ? 'تاريخ البدء' : 'Start Date'}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <div className="pt-2 flex justify-end space-x-2 rtl:space-x-reverse">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gold">
              {isArabic ? 'إنشاء الخصم' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
