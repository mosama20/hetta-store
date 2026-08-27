import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Category, Color, Size } from '../../types/index.js';
import { productsApi, categoriesApi, attributesApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Select } from '../../components/common/Select.js';
import { Card } from '../../components/common/Card.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { MultiImageUploader, ProductImageItem } from '../../components/common/MultiImageUploader.js';
import { Save } from 'lucide-react';

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const { isArabic } = useTheme();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [categoryId, setCategoryId] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [seoTitleAr, setSeoTitleAr] = useState('');
  const [seoTitleEn, setSeoTitleEn] = useState('');
  const [seoDescAr, setSeoDescAr] = useState('');
  const [seoDescEn, setSeoDescEn] = useState('');

  // Images list
  const [images, setImages] = useState<{ url: string; altTextAr?: string; altTextEn?: string }[]>([
    { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80' },
  ]);

  // Variants list
  const [variants, setVariants] = useState<
    { colorId: string; sizeId: string; sku: string; price: number; stockQuantity: number }[]
  >([]);

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), attributesApi.getColors(), attributesApi.getSizes()]).then(
      ([cats, cols, szs]) => {
        setCategories(cats);
        setColors(cols);
        setSizes(szs);
        if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
      },
    );

    if (isEdit && id) {
      productsApi
        .getById(id)
        .then((p) => {
          setCategoryId(p.categoryId);
          setNameAr(p.nameAr);
          setNameEn(p.nameEn);
          setSlug(p.slug);
          setBasePrice(Number(p.basePrice));
          setDescriptionAr(p.descriptionAr || '');
          setDescriptionEn(p.descriptionEn || '');
          setIsFeatured(p.isFeatured);
          setIsActive(p.isActive);
          setSeoTitleAr(p.seoTitleAr || '');
          setSeoTitleEn(p.seoTitleEn || '');
          setSeoDescAr(p.seoDescAr || '');
          setSeoDescEn(p.seoDescEn || '');
          if (p.images.length > 0) setImages(p.images.map((img) => ({ url: img.url })));
          if (p.variants.length > 0) {
            setVariants(
              p.variants.map((v) => ({
                colorId: v.colorId,
                sizeId: v.sizeId,
                sku: v.sku,
                price: Number(v.price),
                stockQuantity: v.stockQuantity,
              })),
            );
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [id, isEdit]);

  const generateVariantMatrix = () => {
    if (colors.length === 0 || sizes.length === 0) return;
    const baseSku = slug ? slug.toUpperCase().slice(0, 4) : 'PROD';
    const newVars: {
      colorId: string;
      sizeId: string;
      sku: string;
      price: number;
      stockQuantity: number;
    }[] = [];

    colors.slice(0, 2).forEach((c) => {
      sizes.slice(0, 3).forEach((s) => {
        newVars.push({
          colorId: c.id,
          sizeId: s.id,
          sku: `${baseSku}-${c.nameEn.slice(0, 3).toUpperCase()}-${s.nameEn}`,
          price: basePrice || 500,
          stockQuantity: 20,
        });
      });
    });
    setVariants(newVars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      categoryId,
      nameAr,
      nameEn,
      slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-'),
      basePrice: Number(basePrice),
      descriptionAr,
      descriptionEn,
      isFeatured,
      isActive,
      seoTitleAr,
      seoTitleEn,
      seoDescAr,
      seoDescEn,
      images,
      variants,
    };

    try {
      if (isEdit && id) {
        await productsApi.update(id, payload);
      } else {
        await productsApi.create(payload);
      }
      navigate('/darsh50/products');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save product');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري تحميل المنتج...' : 'Loading product...'} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-start max-w-4xl mx-auto pb-20">
      <AdminPageHeader
        title={
          isEdit
            ? isArabic
              ? 'تعديل المنتج'
              : 'Edit Product'
            : isArabic
              ? 'إضافة منتج جديد'
              : 'New Product'
        }
        description={
          isArabic
            ? 'إدخال البيانات الأساسية، الصور، ومصفوفة المتغيرات'
            : 'Configure product master data, gallery, and variant matrix'
        }
        action={
          <Button type="submit" variant="gold" size="sm" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'حفظ المنتج' : 'Save Product'}</span>
          </Button>
        }
      />

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* 1. Basic Info */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          {isArabic ? 'البيانات الأساسية' : 'Basic Information'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="URL Slug *"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="oversized-hoodie"
            required
          />
          <Select
            label={isArabic ? 'القسم *' : 'Category *'}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {getLocalized(c.nameAr, c.nameEn, isArabic)}
              </option>
            ))}
          </Select>
          <Input
            label={isArabic ? 'السعر الأساسي (ج.م) *' : 'Base Price (EGP) *'}
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'الوصف بالعربية' : 'Description (Arabic)'}
            </label>
            <textarea
              rows={3}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'الوصف بالإنجليزية' : 'Description (English)'}
            </label>
            <textarea
              rows={3}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 rtl:space-x-reverse pt-2">
          <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span>{isArabic ? 'منتج مميز بالرئيسية' : 'Featured Product'}</span>
          </label>
          <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>{isArabic ? 'نشط وظاهر بالمتجر' : 'Active in Store'}</span>
          </label>
        </div>
      </Card>

      {/* 2. Image Gallery */}
      <Card className="p-6 space-y-4">
        <MultiImageUploader
          images={images as ProductImageItem[]}
          onChange={(newImages) => setImages(newImages)}
          folder="products"
          label={isArabic ? 'معرض صور المنتج' : 'Product Image Gallery'}
          description={
            isArabic
              ? 'ارفع صور المنتج مباشرة من هاتفك أو جهازك المحمول/المكتبي إلى Supabase Storage بدون تحميل على السيرفر.'
              : 'Upload product images directly from phone or laptop to Supabase Storage with zero server load.'
          }
        />
      </Card>

      {/* 3. Variant Matrix Generator */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic
                ? 'متغيرات الألوان والمقاسات والمخزون'
                : 'Variant Matrix (Color x Size x Stock)'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isArabic
                ? 'حدد السعر وكمية المخزون لكل تركيبة'
                : 'Configure individual SKU, price and stock per variant'}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={generateVariantMatrix}>
            <span>{isArabic ? 'توليد تلقائي' : 'Auto Generate'}</span>
          </Button>
        </div>

        {variants.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            {isArabic
              ? 'اضغط "توليد تلقائي" لإنشاء متغيرات المقاسات والألوان.'
              : 'Click "Auto Generate" or add variants manually.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
                <tr>
                  <th className="p-2 text-start">{isArabic ? 'اللون' : 'Color'}</th>
                  <th className="p-2 text-start">{isArabic ? 'المقاس' : 'Size'}</th>
                  <th className="p-2 text-start">SKU</th>
                  <th className="p-2 text-start">{isArabic ? 'السعر' : 'Price'}</th>
                  <th className="p-2 text-start">{isArabic ? 'المخزون' : 'Stock'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {variants.map((v, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <select
                        value={v.colorId}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].colorId = e.target.value;
                          setVariants(updated);
                        }}
                        className="px-2 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded"
                      >
                        {colors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {getLocalized(c.nameAr, c.nameEn, isArabic)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={v.sizeId}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].sizeId = e.target.value;
                          setVariants(updated);
                        }}
                        className="px-2 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded"
                      >
                        {sizes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nameEn}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].sku = e.target.value;
                          setVariants(updated);
                        }}
                        className="w-28 px-2 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].price = Number(e.target.value);
                          setVariants(updated);
                        }}
                        className="w-20 px-2 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={v.stockQuantity}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].stockQuantity = Number(e.target.value);
                          setVariants(updated);
                        }}
                        className="w-16 px-2 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded font-bold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. SEO & Search Engine Optimization */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          {isArabic ? 'إعدادات محركات البحث (SEO Meta)' : 'Search Engine Optimization (SEO)'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={isArabic ? 'عنوان الصفحة لمحركات البحث (بالعربية)' : 'SEO Title (Arabic)'}
            placeholder={isArabic ? 'تيشيرت أوفر سايز رجالي خامة قطن | CRAFT' : 'Oversized Streetwear Tee | CRAFT'}
            value={seoTitleAr}
            onChange={(e) => setSeoTitleAr(e.target.value)}
          />
          <Input
            label={isArabic ? 'عنوان الصفحة لمحركات البحث (بالإنجليزية)' : 'SEO Title (English)'}
            placeholder="Oversized Heavyweight T-Shirt | CRAFT"
            value={seoTitleEn}
            onChange={(e) => setSeoTitleEn(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'وصف الميتا (بالعربية)' : 'Meta Description (Arabic)'}
            </label>
            <textarea
              rows={2}
              value={seoDescAr}
              onChange={(e) => setSeoDescAr(e.target.value)}
              placeholder={isArabic ? 'تسوق أحدث تشكيلات التيشيرتات الأوفر سايز بخامات قطن مصري 100%...' : 'Shop the latest oversized streetwear collections...'}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'وصف الميتا (بالإنجليزية)' : 'Meta Description (English)'}
            </label>
            <textarea
              rows={2}
              value={seoDescEn}
              onChange={(e) => setSeoDescEn(e.target.value)}
              placeholder="Shop premium 100% Egyptian combed cotton oversized tees with fast delivery..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none"
            />
          </div>
        </div>
      </Card>
    </form>
  );
};
