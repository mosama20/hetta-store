import React, { useState } from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../store/themeStore.js';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const { isArabic } = useTheme();
  const [activeTab, setActiveTab] = useState<'tshirt' | 'hoodie' | 'pants'>('tshirt');

  if (!isOpen) return null;

  const tabs = [
    { id: 'tshirt', nameAr: 'تيشيرتات (Oversized)', nameEn: 'T-Shirts (Oversized)' },
    { id: 'hoodie', nameAr: 'هوديز وسويت شيرت', nameEn: 'Hoodies & Sweaters' },
    { id: 'pants', nameAr: 'بنطلونات وكارجو', nameEn: 'Pants & Cargo' },
  ];

  const tshirtData = [
    { size: 'S', chest: '112 سم', length: '72 سم', shoulder: '52 سم' },
    { size: 'M', chest: '118 سم', length: '74 سم', shoulder: '54 سم' },
    { size: 'L', chest: '124 سم', length: '76 سم', shoulder: '56 سم' },
    { size: 'XL', chest: '130 سم', length: '78 سم', shoulder: '58 سم' },
    { size: '2XL', chest: '136 سم', length: '80 سم', shoulder: '60 سم' },
  ];

  const hoodieData = [
    { size: 'M', chest: '122 سم', length: '70 سم', sleeve: '63 سم' },
    { size: 'L', chest: '128 سم', length: '72 سم', sleeve: '65 سم' },
    { size: 'XL', chest: '134 سم', length: '74 سم', sleeve: '67 سم' },
    { size: '2XL', chest: '140 سم', length: '76 سم', sleeve: '69 سم' },
  ];

  const pantsData = [
    { size: '30 (S)', waist: '76 - 80 سم', length: '102 سم', hip: '106 سم' },
    { size: '32 (M)', waist: '81 - 85 سم', length: '104 سم', hip: '112 سم' },
    { size: '34 (L)', waist: '86 - 90 سم', length: '106 سم', hip: '118 سم' },
    { size: '36 (XL)', waist: '91 - 96 سم', length: '108 سم', hip: '124 سم' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative space-y-6 text-start max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-amber-500">
            <Ruler className="w-5 h-5" />
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'دليل المقاسات والأبعاد (سم)' : 'Size Guide & Measurements (CM)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {isArabic ? tab.nameAr : tab.nameEn}
            </button>
          ))}
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto">
          {activeTab === 'tshirt' && (
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black">
                  <th className="p-2.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">{isArabic ? 'المقاس' : 'Size'}</th>
                  <th className="p-2.5">{isArabic ? 'محيط الصدر' : 'Chest'}</th>
                  <th className="p-2.5">{isArabic ? 'الطول' : 'Length'}</th>
                  <th className="p-2.5 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">{isArabic ? 'الكتف' : 'Shoulder'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                {tshirtData.map((row) => (
                  <tr key={row.size} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{row.size}</td>
                    <td className="p-2.5">{row.chest}</td>
                    <td className="p-2.5">{row.length}</td>
                    <td className="p-2.5">{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'hoodie' && (
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black">
                  <th className="p-2.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">{isArabic ? 'المقاس' : 'Size'}</th>
                  <th className="p-2.5">{isArabic ? 'محيط الصدر' : 'Chest'}</th>
                  <th className="p-2.5">{isArabic ? 'الطول' : 'Length'}</th>
                  <th className="p-2.5 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">{isArabic ? 'طول الكم' : 'Sleeve'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                {hoodieData.map((row) => (
                  <tr key={row.size} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{row.size}</td>
                    <td className="p-2.5">{row.chest}</td>
                    <td className="p-2.5">{row.length}</td>
                    <td className="p-2.5">{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'pants' && (
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black">
                  <th className="p-2.5 rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none">{isArabic ? 'المقاس' : 'Size'}</th>
                  <th className="p-2.5">{isArabic ? 'محيط الخصر' : 'Waist'}</th>
                  <th className="p-2.5">{isArabic ? 'الطول' : 'Length'}</th>
                  <th className="p-2.5 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">{isArabic ? 'محيط الأرداف' : 'Hips'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                {pantsData.map((row) => (
                  <tr key={row.size} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{row.size}</td>
                    <td className="p-2.5">{row.waist}</td>
                    <td className="p-2.5">{row.length}</td>
                    <td className="p-2.5">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sizing Tips */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-zinc-900 dark:text-zinc-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isArabic ? 'نصيحة اختيار المقاس:' : 'Fitting Advice:'}</span>
          </div>
          <p className="text-zinc-500 leading-relaxed">
            {isArabic
              ? 'قصاتنا مصممة بنمط أوفر سايز (Oversized Fit) مريح وعصري. إذا كنت تفضل مظهراً مضبوطاً بالضبط على مقاسك (Regular Fit)، ننصحك باختيار مقاس أقل بدرجة واحدة.'
              : 'Our garments are tailored with a relaxed oversized streetwear fit. If you prefer a standard regular fit, we recommend ordering one size down.'}
          </p>
        </div>
      </div>
    </div>
  );
};
