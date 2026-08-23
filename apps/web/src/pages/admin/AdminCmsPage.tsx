import React, { useEffect, useState } from 'react';
import { CMSSection } from '../../types/index.js';
import { cmsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { triggerStoreSync } from '../../store/settingsStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Save } from 'lucide-react';

export const AdminCmsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    cmsApi.getAllSections().then((data) => {
      setSections(data);
      setIsLoading(false);
    });
  }, []);

  const handleUpdate = async (section: CMSSection) => {
    setIsSaving(true);
    await cmsApi.updateSection(section.key, {
      titleAr: section.titleAr,
      titleEn: section.titleEn,
      subtitleAr: section.subtitleAr,
      subtitleEn: section.subtitleEn,
      isActive: section.isActive,
    });
    triggerStoreSync();
    setIsSaving(false);
  };

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading CMS sections...'} />;
  }

  return (
    <div className="space-y-6 text-start max-w-4xl mx-auto pb-20">
      <AdminPageHeader
        title={isArabic ? 'محتوى الواجهة الديناميكي (CMS)' : 'Dynamic CMS Sections'}
        description={
          isArabic
            ? 'تعديل السلايدر الرئيسي، البانرات الدعائية، والنصوص الترويجية بالصفحة الرئيسية'
            : 'Customize homepage hero slider and promotional banner texts'
        }
      />

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <Card key={section.id} className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase text-amber-500">{section.type}</span>
              <span className="font-mono text-[11px] text-zinc-400">key: {section.key}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isArabic ? 'العنوان بالعربية' : 'Title (Arabic)'}
                value={section.titleAr || ''}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[idx].titleAr = e.target.value;
                  setSections(updated);
                }}
              />
              <Input
                label={isArabic ? 'العنوان بالإنجليزية' : 'Title (English)'}
                value={section.titleEn || ''}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[idx].titleEn = e.target.value;
                  setSections(updated);
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isArabic ? 'العنوان الفرعي بالعربية' : 'Subtitle (Arabic)'}
                value={section.subtitleAr || ''}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[idx].subtitleAr = e.target.value;
                  setSections(updated);
                }}
              />
              <Input
                label={isArabic ? 'العنوان الفرعي بالإنجليزية' : 'Subtitle (English)'}
                value={section.subtitleEn || ''}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[idx].subtitleEn = e.target.value;
                  setSections(updated);
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.isActive}
                  onChange={(e) => {
                    const updated = [...sections];
                    updated[idx].isActive = e.target.checked;
                    setSections(updated);
                  }}
                />
                <span>{isArabic ? 'القسم مفعل وظاهر' : 'Section is active'}</span>
              </label>

              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                onClick={() => handleUpdate(section)}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                <span>{isArabic ? 'حفظ التعديل' : 'Save Section'}</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
