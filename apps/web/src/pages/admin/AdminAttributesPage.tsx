import React, { useEffect, useState } from 'react';
import { Color, Size } from '../../types/index.js';
import { attributesApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Card } from '../../components/common/Card.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Plus } from 'lucide-react';

export const AdminAttributesPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New color form
  const [newColorAr, setNewColorAr] = useState('');
  const [newColorEn, setNewColorEn] = useState('');
  const [newHex, setNewHex] = useState('#000000');

  // New size form
  const [newSizeAr, setNewSizeAr] = useState('');
  const [newSizeEn, setNewSizeEn] = useState('');

  const loadAttributes = () => {
    setIsLoading(true);
    Promise.all([attributesApi.getColors(), attributesApi.getSizes()]).then(([cols, szs]) => {
      setColors(cols);
      setSizes(szs);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorAr || !newColorEn) return;
    await attributesApi.createColor({ nameAr: newColorAr, nameEn: newColorEn, hexCode: newHex });
    setNewColorAr('');
    setNewColorEn('');
    loadAttributes();
  };

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeAr || !newSizeEn) return;
    await attributesApi.createSize({ nameAr: newSizeAr, nameEn: newSizeEn });
    setNewSizeAr('');
    setNewSizeEn('');
    loadAttributes();
  };

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading attributes...'} />;
  }

  return (
    <div className="space-y-8 text-start">
      <AdminPageHeader
        title={isArabic ? 'الألوان والمقاسات' : 'Colors & Sizes Dictionary'}
        description={
          isArabic
            ? 'تعريف وتخصيص الألوان بدرجات Hex ومقاسات الملابس القياسية'
            : 'Standardize garment swatches and size sizing metrics'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colors Section */}
        <Card className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            {isArabic ? 'درجات الألوان (Color Swatches)' : 'Garment Colors'}
          </h3>

          <form
            onSubmit={handleAddColor}
            className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={isArabic ? 'الاسم بالعربية' : 'Arabic Name'}
                placeholder="أسود"
                value={newColorAr}
                onChange={(e) => setNewColorAr(e.target.value)}
                required
              />
              <Input
                label={isArabic ? 'الاسم بالإنجليزية' : 'English Name'}
                placeholder="Black"
                value={newColorEn}
                onChange={(e) => setNewColorEn(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <input
                type="color"
                value={newHex}
                onChange={(e) => setNewHex(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-700 p-0.5 bg-transparent"
              />
              <Input label="Hex Code" value={newHex} onChange={(e) => setNewHex(e.target.value)} />
              <Button type="submit" variant="primary" size="sm" className="mt-5 shrink-0">
                <Plus className="w-4 h-4 mr-1" />
                <span>{isArabic ? 'إضافة' : 'Add'}</span>
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {colors.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center space-x-2.5 rtl:space-x-reverse border border-zinc-100 dark:border-zinc-700"
              >
                <span
                  className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: c.hexCode }}
                />
                <div className="truncate text-xs">
                  <p className="font-bold truncate">{getLocalized(c.nameAr, c.nameEn, isArabic)}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">{c.hexCode}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sizes Section */}
        <Card className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            {isArabic ? 'مقاسات الملابس القياسية' : 'Standard Garment Sizes'}
          </h3>

          <form
            onSubmit={handleAddSize}
            className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={isArabic ? 'الاسم بالعربية' : 'Arabic Label'}
                placeholder="كبير (L)"
                value={newSizeAr}
                onChange={(e) => setNewSizeAr(e.target.value)}
                required
              />
              <Input
                label={isArabic ? 'الرمز (S, M, L...)' : 'Size Code (S, M...)'}
                placeholder="L"
                value={newSizeEn}
                onChange={(e) => setNewSizeEn(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              <span>{isArabic ? 'إضافة مقاس' : 'Add Size'}</span>
            </Button>
          </form>

          <div className="flex flex-wrap gap-2.5">
            {sizes.map((s) => (
              <div
                key={s.id}
                className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-center font-bold text-xs"
              >
                <span>{s.nameEn}</span>
                <span className="text-[10px] text-zinc-400 block font-normal">{s.nameAr}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
