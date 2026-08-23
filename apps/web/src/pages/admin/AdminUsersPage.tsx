import React, { useEffect, useState } from 'react';
import { User } from '../../types/index.js';
import { usersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Plus, UserCheck, UserX } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const loadUsers = () => {
    setIsLoading(true);
    Promise.all([usersApi.getAll(), usersApi.getRoles()]).then(([res, r]) => {
      setUsers(res.items);
      setRoles(r);
      if (r.length > 0) setSelectedRoleId(r[0].id);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await usersApi.create({
      email,
      password,
      fullName,
      roleIds: selectedRoleId ? [selectedRoleId] : [],
    });
    setModalOpen(false);
    loadUsers();
  };

  const handleToggleActive = async (u: User) => {
    await usersApi.update(u.id, { isActive: !u.isActive });
    loadUsers();
  };

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={isArabic ? 'المستخدمين والصلاحيات' : 'User Management & RBAC'}
        description={
          isArabic
            ? 'إدارة حسابات المشرفين، مدراء المتجر، وموظفي المبيعات'
            : 'Manage system administrators, store managers, and sales agents'
        }
        action={
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'مستخدم جديد' : 'New User'}</span>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading users...'} />
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'الاسم' : 'Full Name'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الأدوار' : 'Roles'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-end">{isArabic ? 'تفعيل/تعطيل' : 'Toggle Active'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => {
                const roleNames = Array.isArray(u.roles)
                  ? u.roles.map((r) => (typeof r === 'string' ? r : r.name)).join(', ')
                  : '';

                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                      {u.fullName}
                    </td>
                    <td className="p-3.5 text-zinc-500">{u.email}</td>
                    <td className="p-3.5 font-semibold text-amber-600">{roleNames || 'Staff'}</td>
                    <td className="p-3.5">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive
                          ? isArabic
                            ? 'نشط'
                            : 'Active'
                          : isArabic
                            ? 'معطل'
                            : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-end">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(u)}>
                        {u.isActive ? (
                          <UserX className="w-4 h-4 text-red-500" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isArabic ? 'إضافة مستخدم جديد' : 'New User'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={isArabic ? 'الاسم الكامل *' : 'Full Name *'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label={isArabic ? 'البريد الإلكتروني *' : 'Email *'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={isArabic ? 'كلمة المرور *' : 'Password *'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isArabic ? 'الدور الوظيفي' : 'Role'}
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-2 flex justify-end space-x-2 rtl:space-x-reverse">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gold">
              {isArabic ? 'إنشاء' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
