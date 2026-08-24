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
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { triggerStoreSync } from '../../store/settingsStore.js';

export const AdminCategoriesPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchCategories = () => {
    setIsLoading(true);
    categoriesApi
      .getAll(true)
      .then((data) => {
        setCategories(data);
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
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setNameAr(cat.nameAr);
    setNameEn(cat.nameEn);
    setSlug(cat.slug);
    setParentId(cat.parentId || '');
    setImageUrl(cat.imageUrl || '');
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
    };

    if (editingCat) {
      await categoriesApi.update(editingCat.id, payload);
    } else {
      await categoriesApi.create(payload);
    }

    triggerStoreSync();
    setModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isArabic ? 'حذف هذا القسم؟' : 'Delete category?')) return;
    try {
      await categoriesApi.delete(id);
      triggerStoreSync();
      fetchCategories();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'إدارة الأقسام والتصنيفات' : 'Category Hierarchy'}
        description={
          isArabic
            ? 'تنظيم هيكل المنتجات والتصنيفات الفرعية'
            : 'Manage multi-level fashion categories and taxonomy'
        }
        action={
          <Button variant="gold" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'إضافة قسم' : 'New Category'}</span>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading categories...'} />
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'اسم القسم' : 'Category Name'}</th>
                <th className="p-3.5 text-start">Slug</th>
                <th className="p-3.5 text-start">
                  {isArabic ? 'القسم الرئيسي' : 'Parent Category'}
                </th>
                <th className="p-3.5 text-start">{isArabic ? 'المنتجات' : 'Products'}</th>
                <th className="p-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <span>{getLocalized(c.nameAr, c.nameEn, isArabic)}</span>
                  </td>
                  <td className="p-3.5 font-mono text-zinc-400">/{c.slug}</td>
                  <td className="p-3.5 text-zinc-500">
                    {c.parent ? getLocalized(c.parent.nameAr, c.parent.nameEn, isArabic) : '—'}
                  </td>
                  <td className="p-3.5 font-semibold">{c._count?.products ?? 0}</td>
                  <td className="p-3.5 text-end">
                    <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(c)}
                        className="p-1.5"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCat
            ? isArabic
              ? 'تعديل القسم'
              : 'Edit Category'
            : isArabic
              ? 'إضافة قسم جديد'
              : 'New Category'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={isArabic ? 'الاسم بالعربية *' : 'Name (Arabic) *'}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
          <Input
            label={isArabic ? 'الاسم بالإنجليزية *' : 'Name (English) *'}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="hoodies"
          />
          <Select
            label={isArabic ? 'القسم الرئيسي (اختياري)' : 'Parent Category (Optional)'}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">{isArabic ? 'بدون (قسم رئيسي)' : 'None (Top Level)'}</option>
            {categories
              .filter((c) => !editingCat || c.id !== editingCat.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {getLocalized(c.nameAr, c.nameEn, isArabic)}
                </option>
              ))}
          </Select>
          <ImageUploader
            label={isArabic ? 'صورة القسم (اختياري)' : 'Category Image (Optional)'}
            value={imageUrl}
            onChange={setImageUrl}
            folder="categories"
            compact
          />
          <div className="pt-2 flex justify-end space-x-2 rtl:space-x-reverse">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gold">
              {isArabic ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
