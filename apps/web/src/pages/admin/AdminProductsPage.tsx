import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Product } from '../../types/index.js';
import { productsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Plus, Edit2, Trash2, FileSpreadsheet, Download, Sparkles } from 'lucide-react';
import { ExcelImportModal } from '../../components/admin/ExcelImportModal.js';

export const AdminProductsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const fetchProducts = () => {
    setIsLoading(true);
    productsApi
      .getAll({ page, limit: 10, search, all: true })
      .then((res) => {
        setProducts(res.items);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleToggleFeatured = async (product: Product) => {
    try {
      const updatedStatus = !product.isFeatured;
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isFeatured: updatedStatus } : p)),
      );
      await productsApi.update(product.id, { isFeatured: updatedStatus });
    } catch {
      fetchProducts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isArabic ? 'هل تريد بالتأكيد أرشفة هذا المنتج؟' : 'Archive this product?'))
      return;
    await productsApi.delete(id);
    fetchProducts();
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const res = await productsApi.getAll({ limit: 1000, all: true });
      const allProds = res.items;

      const exportRows: any[] = [];

      allProds.forEach((prod) => {
        const catName = prod.category ? getLocalized(prod.category.nameAr, prod.category.nameEn, isArabic) : '';
        const primaryImg = prod.images?.[0]?.url || '';

        if (prod.variants && prod.variants.length > 0) {
          prod.variants.forEach((v) => {
            exportRows.push({
              'اسم المنتج بالعربية *': prod.nameAr,
              'اسم المنتج بالإنجليزية *': prod.nameEn,
              'القسم *': catName,
              'السعر الأساسي (ج.م) *': Number(v.price || prod.basePrice),
              'اللون': isArabic ? v.color?.nameAr : v.color?.nameEn,
              'المقاس': isArabic ? v.size?.nameAr : v.size?.nameEn,
              'الكمية بالمخزن': v.stockQuantity,
              'رمز SKU': v.sku,
              'رابط الصورة': primaryImg,
              'الوصف بالعربية': prod.descriptionAr || '',
              'الوصف بالإنجليزية': prod.descriptionEn || '',
              'الحالة': prod.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'مسودة' : 'Draft'),
            });
          });
        } else {
          exportRows.push({
            'اسم المنتج بالعربية *': prod.nameAr,
            'اسم المنتج بالإنجليزية *': prod.nameEn,
            'القسم *': catName,
            'السعر الأساسي (ج.م) *': Number(prod.basePrice),
            'اللون': '',
            'المقاس': '',
            'الكمية بالمخزن': 0,
            'رمز SKU': '',
            'رابط الصورة': primaryImg,
            'الوصف بالعربية': prod.descriptionAr || '',
            'الوصف بالإنجليزية': prod.descriptionEn || '',
            'الحالة': prod.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'مسودة' : 'Draft'),
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      worksheet['!cols'] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 18 },
        { wch: 45 },
        { wch: 30 },
        { wch: 30 },
        { wch: 12 },
      ];

      XLSX.writeFile(workbook, `fashion_store_products_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'إدارة المنتجات والمخزون' : 'Product Inventory'}
        description={
          isArabic
            ? 'إضافة وتعديل المنتجات وإدارة تفاصيل المقاسات والألوان'
            : 'Manage fashion catalog items, variants, and stock'
        }
        action={
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              isLoading={isExporting}
            >
              <Download className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-blue-600" />
              <span>{isArabic ? 'تصدير إكسيل' : 'Export Excel'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExcelModalOpen(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-emerald-600" />
              <span>{isArabic ? 'استيراد إكسيل' : 'Excel Import'}</span>
            </Button>
            <Link to="/darsh50/products/new">
              <Button variant="gold" size="sm">
                <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                <span>{isArabic ? 'إضافة منتج جديد' : 'New Product'}</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="max-w-xs">
        <Input
          placeholder={isArabic ? 'بحث باسم المنتج أو SKU...' : 'Search products or SKU...'}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري تحميل المنتجات...' : 'Loading products...'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase">
                <tr>
                  <th className="p-3.5">{isArabic ? 'المنتج' : 'Product'}</th>
                  <th className="p-3.5">{isArabic ? 'القسم' : 'Category'}</th>
                  <th className="p-3.5">{isArabic ? 'السعر الأساسي' : 'Base Price'}</th>
                  <th className="p-3.5">{isArabic ? 'المتغيرات' : 'Variants'}</th>
                  <th className="p-3.5 text-center">{isArabic ? 'جديدنا / مميز' : 'Featured'}</th>
                  <th className="p-3.5">{isArabic ? 'الحالة' : 'Status'}</th>
                  <th className="p-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {products.map((p) => {
                  const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
                  const img =
                    p.images[0]?.url ||
                    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80';

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <img src={img} alt="" className="w-9 h-11 object-cover rounded-lg" />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">
                              {getLocalized(p.nameAr, p.nameEn, isArabic)}
                            </p>
                            <p className="text-[10px] text-zinc-400">/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">
                        {p.category
                          ? getLocalized(p.category.nameAr, p.category.nameEn, isArabic)
                          : '-'}
                      </td>
                      <td className="p-3.5 font-bold">
                        {formatPrice(Number(p.basePrice), 'EGP', isArabic)}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold">{p.variants.length}</span>{' '}
                        {isArabic ? 'متغير' : 'vars'} ({totalStock} {isArabic ? 'قطعة' : 'pcs'})
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p)}
                          className={`p-1.5 rounded-xl border transition inline-flex items-center justify-center ${
                            p.isFeatured
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-amber-500'
                          }`}
                          title={
                            p.isFeatured
                              ? isArabic
                                ? 'معروض في جديدنا ومميز (انقر للإلغاء)'
                                : 'Featured in New Arrivals (Click to disable)'
                              : isArabic
                                ? 'انقر لتمييز المنتج وعرضه في جديدنا'
                                : 'Click to feature in New Arrivals'
                          }
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${p.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={p.isActive ? 'success' : 'secondary'}>
                          {p.isActive
                            ? isArabic
                              ? 'نشط'
                              : 'Active'
                            : isArabic
                              ? 'مسودة'
                              : 'Draft'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                          <Link to={`/darsh50/products/${p.id}`}>
                            <Button variant="ghost" size="sm" className="p-1.5">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ExcelImportModal isOpen={excelModalOpen} onClose={() => setExcelModalOpen(false)} onSuccess={fetchProducts} />

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};
