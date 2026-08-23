import React, { useEffect, useState } from 'react';
import { mediaApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [media, setMedia] = useState<{ id: string; url: string; mimeType: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  const loadMedia = () => {
    setIsLoading(true);
    mediaApi.getAll().then((res: { items: { id: string; url: string; mimeType: string }[] }) => {
      setMedia(res.items);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    await mediaApi.register({
      url: newUrl,
      mimeType: 'image/jpeg',
      fileSize: 102400,
    });
    setNewUrl('');
    setModalOpen(false);
    loadMedia();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isArabic ? 'حذف هذه الصورة؟' : 'Delete media record?')) return;
    await mediaApi.delete(id);
    loadMedia();
  };

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'مكتبة الوسائط والصور' : 'Media Assets'}
        description={
          isArabic
            ? 'إدارة روابط ومكتبة صور المنتجات والحملات الترويجية'
            : 'Manage uploaded fashion product gallery assets'
        }
        action={
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'تسجيل صورة' : 'Register Image'}</span>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading media...'} />
      ) : media.length === 0 ? (
        <Card className="p-12 text-center text-zinc-400 space-y-3">
          <ImageIcon className="w-8 h-8 mx-auto text-zinc-300" />
          <p className="text-sm">
            {isArabic ? 'لا توجد وسائط مسجلة حتى الآن.' : 'No media items registered yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <Card key={item.id} className="group relative aspect-[3/4] overflow-hidden">
              <img src={item.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isArabic ? 'تسجيل رابط صورة' : 'Register Image URL'}
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Image URL"
            placeholder="https://images.unsplash.com/..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <div className="pt-2 flex justify-end space-x-2 rtl:space-x-reverse">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gold">
              {isArabic ? 'تسجيل' : 'Register'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
