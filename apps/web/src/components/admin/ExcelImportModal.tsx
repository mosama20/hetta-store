import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { productsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedProductRow {
  nameAr: string;
  nameEn: string;
  categoryName?: string;
  basePrice: number;
  colorName?: string;
  sizeName?: string;
  stockQuantity?: number;
  sku?: string;
  imageUrl?: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isArabic } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Generate & Download Sample Template
  const handleDownloadTemplate = async () => {
    const sampleData = [
      {
        'اسم المنتج بالعربية *': 'تيشيرت أساسي أوفرسايز',
        'اسم المنتج بالإنجليزية *': 'Essential Oversized Tee',
        'القسم *': 'تيشيرتات',
        'السعر الأساسي (ج.م) *': 599,
        'اللون': 'أسود فحمي',
        'المقاس': 'L',
        'الكمية بالمخزن': 25,
        'رمز SKU': 'CRF-TEE-BLK-L',
        'رابط الصورة': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
        'الوصف بالعربية': 'قطن مصري 100% عالي الكثافة بقصة مريحة',
        'الوصف بالإنجليزية': 'Heavyweight 100% Egyptian cotton oversized fit',
      },
      {
        'اسم المنتج بالعربية *': 'هودي سادة فاخر',
        'اسم المنتج بالإنجليزية *': 'Minimalist Heavy Hoodie',
        'القسم *': 'هوديز',
        'السعر الأساسي (ج.م) *': 899,
        'اللون': 'بيج رملي',
        'المقاس': 'XL',
        'الكمية بالمخزن': 20,
        'رمز SKU': 'CRF-HOD-BGE-XL',
        'رابط الصورة': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
        'الوصف بالعربية': 'هودي قطني ثقيل 450 جرام بتصميم مينيمالي',
        'الوصف بالإنجليزية': '450 GSM heavyweight French terry cotton',
      },
      {
        'اسم المنتج بالعربية *': 'بنطلون كارغو عصري',
        'اسم المنتج بالإنجليزية *': 'Modern Cargo Pants',
        'القسم *': 'بنطلونات',
        'السعر الأساسي (ج.م) *': 1199,
        'اللون': 'رمادي حجري',
        'المقاس': 'M',
        'الكمية بالمخزن': 15,
        'رمز SKU': 'CRF-PAN-GRY-M',
        'رابط الصورة': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
        'الوصف بالعربية': 'جبردين عالي الجودة مع جيوب جانبية',
        'الوصف بالإنجليزية': 'Structured cotton twill with cargo pockets',
      },
    ];

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');

    // Auto width
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
      { wch: 35 },
      { wch: 35 },
    ];

    XLSX.writeFile(workbook, 'fashion_store_products_template.xlsx');
  };

  // 2. Read and Parse Uploaded File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setResultMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const rows: ParsedProductRow[] = rawJson.map((r) => {
          return {
            nameAr: r['اسم المنتج بالعربية *'] || r['اسم المنتج بالعربية'] || r['nameAr'] || r['Name (Ar)'] || '',
            nameEn: r['اسم المنتج بالإنجليزية *'] || r['اسم المنتج بالإنجليزية'] || r['nameEn'] || r['Name (En)'] || '',
            categoryName: r['القسم *'] || r['القسم'] || r['category'] || r['Category'] || '',
            basePrice: Number(r['السعر الأساسي (ج.م) *'] || r['السعر'] || r['basePrice'] || r['Price'] || 0),
            colorName: r['اللون'] || r['color'] || r['Color'] || '',
            sizeName: r['المقاس'] || r['size'] || r['Size'] || '',
            stockQuantity: Number(r['الكمية بالمخزن'] || r['الكمية'] || r['stockQuantity'] || r['Stock'] || 20),
            sku: r['رمز SKU'] || r['sku'] || r['SKU'] || '',
            imageUrl: r['رابط الصورة'] || r['image'] || r['imageUrl'] || '',
            descriptionAr: r['الوصف بالعربية'] || r['descriptionAr'] || '',
            descriptionEn: r['الوصف بالإنجليزية'] || r['descriptionEn'] || '',
          };
        });

        // Filter valid non-empty rows
        const validRows = rows.filter((r) => r.nameAr || r.nameEn);
        setParsedRows(validRows);
        setIsParsing(false);
      } catch (err: any) {
        setResultMsg({ type: 'error', text: isArabic ? 'فشل قراءة ملف الإكسيل. تأكد من صيغة الملف.' : 'Failed to parse Excel file.' });
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // 3. Submit Bulk Import to Server
  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setResultMsg(null);

    try {
      const res = await productsApi.bulkImport(parsedRows);
      setResultMsg({
        type: 'success',
        text: isArabic
          ? `تم استيراد ${res.importedCount} منتج بنجاح في قاعدة البيانات!`
          : `Successfully imported ${res.importedCount} products into database!`,
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.message || (isArabic ? 'فشل استيراد المنتجات' : 'Bulk import failed'),
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isArabic ? 'استيراد المنتجات من ملف إكسيل (Bulk Import)' : 'Bulk Import Products from Excel'}
    >
      <div className="space-y-6 text-start">
        {/* Step 1: Download Template */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? '1. تحميل نموذج الإكسيل الجاهز' : '1. Download Sample Excel Template'}
            </h4>
            <p className="text-[11px] text-zinc-500">
              {isArabic
                ? 'قم بتحميل القالب لتعبئة بيانات المنتجات بالأعمدة المعتمدة.'
                : 'Download pre-formatted Excel template with columns.'}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="shrink-0">
            <Download className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'تحميل القالب (.xlsx)' : 'Download (.xlsx)'}</span>
          </Button>
        </div>

        {/* Step 2: Upload Excel File */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
            {isArabic ? '2. اختيار أو سحب ملف الإكسيل (.xlsx / .xls / .csv)' : '2. Select or Drop Excel File'}
          </label>
          <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-2xl p-6 text-center transition cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/50">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {file ? file.name : (isArabic ? 'اضغط لاختيار الملف أو اسحبه هنا' : 'Click to select file or drag & drop')}
              </p>
              <p className="text-[11px] text-zinc-400">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'XLSX, XLS, CSV'}
              </p>
            </div>
          </div>
        </div>

        {/* Results / Status Messages */}
        {resultMsg && (
          <div
            className={`p-3.5 rounded-xl flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold ${
              resultMsg.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}
          >
            {resultMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{resultMsg.text}</span>
          </div>
        )}

        {/* Step 3: Live Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <span>{isArabic ? `معاينة البيانات (${parsedRows.length} منتج)` : `Data Preview (${parsedRows.length} items)`}</span>
              <span className="text-emerald-600 font-semibold">{isArabic ? 'جاهز للاستيراد' : 'Ready to import'}</span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-[11px]">
                <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-bold sticky top-0">
                  <tr>
                    <th className="p-2 text-start">{isArabic ? 'الاسم' : 'Name'}</th>
                    <th className="p-2 text-start">{isArabic ? 'القسم' : 'Category'}</th>
                    <th className="p-2 text-start">{isArabic ? 'السعر' : 'Price'}</th>
                    <th className="p-2 text-start">{isArabic ? 'اللون / المقاس' : 'Color/Size'}</th>
                    <th className="p-2 text-start">{isArabic ? 'المخزون' : 'Stock'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-2 font-bold">{r.nameAr || r.nameEn}</td>
                      <td className="p-2 text-zinc-500">{r.categoryName || '-'}</td>
                      <td className="p-2 font-black">{r.basePrice} EGP</td>
                      <td className="p-2 text-zinc-500">{r.colorName || '-'} / {r.sizeName || '-'}</td>
                      <td className="p-2 font-bold">{r.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-2 rtl:space-x-reverse">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="gold"
            disabled={parsedRows.length === 0 || isSubmitting || isParsing}
            isLoading={isSubmitting}
            onClick={handleImportSubmit}
            className="shadow-md"
          >
            <Upload className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? `تأكيد استيراد (${parsedRows.length}) منتج` : `Confirm Import (${parsedRows.length}) Products`}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
