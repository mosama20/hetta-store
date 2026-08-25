import React, { useEffect, useState } from 'react';
import { Category } from '../../types/index.js';
import { categoriesApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { Card } from '../../components/common/Card.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { ImageUploader } from '../../components/common/ImageUploader.js';
import {
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import { triggerStoreSync } from '../../store/settingsStore.js';

export const AdminCategoriesPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchCategories = () => {
    setIsLoading(true);
    categoriesApi
      .getAll(true)
      .then((data) => {
        // Sort by displayOrder
        const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setCategories(sorted);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCat(null);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setParentId('');
    setImageUrl('');
    setDisplayOrder(categories.length);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setNameAr(cat.nameAr);
    setNameEn(cat.nameEn);
    setSlug(cat.slug);
    setParentId(cat.parentId || '');
    setImageUrl(cat.imageUrl || '');
    setDisplayOrder(cat.displayOrder ?? 0);
    setIsActive(cat.isActive ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nameAr,
      nameEn,
      slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-'),
      parentId: parentId || undefined,
      imageUrl: imageUrl || undefined,
      displayOrder: Number(displayOrder) || 0,
      isActive,
    };

    if (editingCat) {
      await categoriesApi.update(editingCat.id, payload);
    } else {
      await categoriesApi.create(payload);
    }

    triggerStoreSync();
    setModalOpen(false);
    setSuccessMsg(
      isArabic
        ? editingCat
          ? 'تم تحديث القسم بنجاح!'
          : 'تم إضافة القسم الجديد بنجاح!'
        : 'Category saved successfully!',
    );
    setTimeout(() => setSuccessMsg(''), 3000);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      triggerStoreSync();
      fetchCategories();
      setSuccessMsg(isArabic ? 'تم حذف القسم بنجاح' : 'Category deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Reorder Category: Move Up
  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newCategories = [...categories];
    const current = newCategories[index];
    const prev = newCategories[index - 1];

    newCategories[index] = prev;
    newCategories[index - 1] = current;

    // Recalculate displayOrders
    const reorderedItems = newCategories.map((c, idx) => ({
      id: c.id,
      displayOrder: idx,
    }));

    setCategories(
      newCategories.map((c, idx) => ({
        ...c,
        displayOrder: idx,
      })),
    );

    try {
      await categoriesApi.reorder(reorderedItems);
      triggerStoreSync();
      setSuccessMsg(isArabic ? 'تم تحديث ترتيب الأقسام فورياً!' : 'Categories reordered successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch {
      fetchCategories();
    }
  };

  // Reorder Category: Move Down
  const moveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    const current = newCategories[index];
    const next = newCategories[index + 1];

    newCategories[index] = next;
    newCategories[index + 1] = current;

    // Recalculate displayOrders
    const reorderedItems = newCategories.map((c, idx) => ({
      id: c.id,
      displayOrder: idx,
    }));

    setCategories(
      newCategories.map((c, idx) => ({
        ...c,
        displayOrder: idx,
      })),
    );

    try {
      await categoriesApi.reorder(reorderedItems);
      triggerStoreSync();
      setSuccessMsg(isArabic ? 'تم تحديث ترتيب الأقسام فورياً!' : 'Categories reordered successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch {
      fetchCategories();
    }
  };

  // Quick Toggle Active State
  const toggleActive = async (cat: Category) => {
    try {
      const nextActive = !cat.isActive;
      await categoriesApi.update(cat.id, { isActive: nextActive });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextActive } : c)),
      );
      triggerStoreSync();
    } catch {
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6 text-start max-w-6xl mx-auto pb-16">
      <AdminPageHeader
        title={isArabic ? 'إدارة الأقسام وترتيب العرض' : 'Category Hierarchy & Order'}
        description={
          isArabic
            ? 'تنظيم هيكل المنتجات، وتحديد ترتيب ظهور الأقسام في القائمة العلوية والصفحة الرئيسية'
            : 'Manage fashion categories, taxonomy hierarchy, and customize frontend display order'
        }
        action={
          <Button variant="gold" size="sm" onClick={openCreateModal} className="shadow-md">
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'إضافة قسم جديد' : 'New Category'}</span>
          </Button>
        }
      />

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Info helper banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {isArabic
              ? '💡 يمكنك استخدام أسهم الترتيب (⬆️ / ⬇️) لتغيير أولوية ظهور الأقسام في القوائم والهوم بيج فورياً.'
              : 'Use the reorder arrows (⬆️ / ⬇️) to reorder categories in menus and homepage instantly.'}
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold opacity-80">
          {categories.length} {isArabic ? 'أقسام مضافة' : 'categories'}
        </span>
      </div>

      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading categories...'} />
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3 text-zinc-500">
            <Layers className="w-10 h-10 mx-auto text-zinc-400 opacity-50" />
            <p className="text-sm font-bold">
              {isArabic ? 'لا توجد أقسام مضافة حتى الآن' : 'No categories found'}
            </p>
            <Button variant="gold" size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'إضافة أول قسم' : 'Add First Category'}</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 text-center w-28">{isArabic ? 'الترتيب' : 'Order'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'اسم القسم' : 'Category Name'}</th>
                  <th className="p-3.5 text-start">Slug</th>
                  <th className="p-3.5 text-start">
                    {isArabic ? 'القسم الرئيسي' : 'Parent Category'}
                  </th>
                  <th className="p-3.5 text-center">{isArabic ? 'المنتجات' : 'Products'}</th>
                  <th className="p-3.5 text-center">{isArabic ? 'الحالة' : 'Status'}</th>
                  <th className="p-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {categories.map((c, index) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                      c.isActive === false ? 'opacity-60 bg-zinc-50/50 dark:bg-zinc-900/40' : ''
                    }`}
                  >
                    {/* Reorder Buttons & Badge */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-600 transition ${
                              index === 0 ? 'opacity-20 cursor-not-allowed' : ''
                            }`}
                            title={isArabic ? 'تحريك للأعلى' : 'Move Up'}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(index)}
                            disabled={index === categories.length - 1}
                            className={`p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950/60 text-zinc-600 dark:text-zinc-300 hover:text-amber-600 transition ${
                              index === categories.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                            }`}
                            title={isArabic ? 'تحريك للأسفل' : 'Move Down'}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Name and Thumbnail */}
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2.5">
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xs">{getLocalized(c.nameAr, c.nameEn, isArabic)}</p>
                          <p className="text-[10px] text-zinc-400 font-normal">
                            {isArabic ? c.nameEn : c.nameAr}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="p-3.5 font-mono text-zinc-400">/{c.slug}</td>

                    {/* Parent */}
                    <td className="p-3.5 text-zinc-500">
                      {c.parent ? (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                          {getLocalized(c.parent.nameAr, c.parent.nameEn, isArabic)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Products Count */}
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-[11px]">
                        {c._count?.products ?? 0}
                      </span>
                    </td>

                    {/* Active/Inactive Toggle */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleActive(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          c.isActive !== false
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700'
                        }`}
                        title={isArabic ? 'اضغط لتغيير الحالة' : 'Click to toggle status'}
                      >
                        {c.isActive !== false ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>{isArabic ? 'نشط' : 'Active'}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>{isArabic ? 'مخفي' : 'Hidden'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-end">
                      <div className="flex items-center justify-end space-x-1.5 rtl:space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                          title={isArabic ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                          title={isArabic ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Category Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCat
            ? isArabic
              ? 'تعديل بيانات القسم وترتيبه'
              : 'Edit Category & Order'
            : isArabic
              ? 'إضافة قسم وتصنيف جديد'
              : 'Add New Category'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isArabic ? 'الاسم بالعربية *' : 'Name (Arabic) *'}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="هوديز وسويت شيرتس"
              required
            />
            <Input
              label={isArabic ? 'الاسم بالإنجليزية *' : 'Name (English) *'}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Hoodies & Sweatshirts"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="hoodies"
            />
            <Input
              label={isArabic ? 'رقم الترتيب (Display Order)' : 'Display Order'}
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <Select
            label={isArabic ? 'القسم الرئيسي (اختياري للتصنيف الشجري)' : 'Parent Category (Optional)'}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">{isArabic ? 'بدون (قسم رئيسي علوي)' : 'None (Top Level Category)'}</option>
            {categories
              .filter((c) => !editingCat || c.id !== editingCat.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {getLocalized(c.nameAr, c.nameEn, isArabic)}
                </option>
              ))}
          </Select>

          <ImageUploader
            label={isArabic ? 'صورة القسم أو التشكيلة' : 'Category Cover Image'}
            value={imageUrl}
            onChange={setImageUrl}
            folder="categories"
            aspectRatio="square"
            compact
          />

          <div className="pt-1 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
            <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'تفعيل القسم وإظهاره للزوار' : 'Enable & show to customers'}
              </span>
            </label>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" variant="gold">
                {isArabic ? 'حفظ القسم' : 'Save Category'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
