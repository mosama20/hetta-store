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
import {
  Plus,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Shield,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; displayNameAr: string; displayNameEn: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadUsers = () => {
    setIsLoading(true);
    Promise.all([
      usersApi.getAll({ search: search || undefined, role: roleFilter || undefined }),
      usersApi.getRoles(),
    ]).then(([res, r]) => {
      setUsers(res.items);
      setRoles(r);
      if (r.length > 0 && !selectedRoleId) setSelectedRoleId(r[0].name);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await usersApi.create({
        email,
        password,
        fullName,
        phone,
        roleIds: selectedRoleId ? [selectedRoleId] : ['STORE_MANAGER'],
      });
      setCreateModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      loadUsers();
    } catch {
      // create error
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditIsActive(u.isActive);
    setEditPassword('');
    const primaryRole = Array.isArray(u.roles) && u.roles[0]
      ? typeof u.roles[0] === 'string'
        ? u.roles[0]
        : u.roles[0].name
      : 'STORE_MANAGER';
    setEditRoleId(primaryRole);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await usersApi.update(editingUser.id, {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
        isActive: editIsActive,
        roleIds: [editRoleId],
        ...(editPassword ? { password: editPassword } : {}),
      });
      setEditingUser(null);
      loadUsers();
    } catch {
      // update error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await usersApi.delete(userToDelete.id);
      setUserToDelete(null);
      loadUsers();
    } catch (err: unknown) {
      setDeleteError((err as Error).message || (isArabic ? 'فشل حذف المستخدم' : 'Failed to delete user'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    await usersApi.update(u.id, { isActive: !u.isActive });
    loadUsers();
  };

  const getRoleDisplayName = (roleName: string) => {
    const found = roles.find((r) => r.name === roleName);
    if (found) {
      return isArabic ? found.displayNameAr : found.displayNameEn;
    }
    return roleName;
  };

  return (
    <div className="space-y-6 text-start pb-20">
      <AdminPageHeader
        title={isArabic ? 'إدارة المستخدمين والمشرفين (User Management)' : 'User Management & Permissions'}
        description={
          isArabic
            ? 'إضافة وتعديل وحذف حسابات المشرفين، مدراء المتجر، ومسؤولي المبيعات والطلبات'
            : 'Create, edit, delete, and control roles & statuses for store staff and admins'
        }
        action={
          <Button variant="gold" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'إضافة مستخدم جديد' : 'New User'}</span>
          </Button>
        }
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-72 relative">
          <Input
            placeholder={isArabic ? 'بحث بالاسم، الإيميل، أو الهاتف...' : 'Search name, email, phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
          >
            <option value="">{isArabic ? 'جميع الأدوار الوظيفية' : 'All Roles'}</option>
            {roles.map((r) => (
              <option key={r.id || r.name} value={r.name}>
                {isArabic ? r.displayNameAr : r.displayNameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading users...'} />
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p className="font-bold text-sm">
              {isArabic ? 'لا يوجد مستخدمين يطابقون البحث' : 'No users found'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'الاسم والبيانات' : 'User Details'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'رقم الهاتف' : 'Phone'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الدور الوظيفي' : 'Role'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => {
                const roleNames = Array.isArray(u.roles)
                  ? u.roles
                      .map((r) => (typeof r === 'string' ? getRoleDisplayName(r) : r.displayNameAr || r.name))
                      .join(', ')
                  : 'Store Staff';

                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {u.fullName}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400">ID: {u.id}</p>
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-zinc-400" />
                        <span>{u.email}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400" dir="ltr">
                      {u.phone ? (
                        <span className="flex items-center gap-1 justify-start">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{u.phone}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-[11px]">
                        <Shield className="w-3 h-3 text-amber-500" />
                        <span>{roleNames}</span>
                      </span>
                    </td>
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? (isArabic ? 'تعطيل الحساب' : 'Disable') : (isArabic ? 'تفعيل الحساب' : 'Enable')}
                        >
                          {u.isActive ? (
                            <UserX className="w-4 h-4 text-zinc-400 hover:text-amber-600" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(u)}
                          title={isArabic ? 'تعديل بيانات المستخدم' : 'Edit User'}
                        >
                          <Edit2 className="w-4 h-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(u)}
                          title={isArabic ? 'حذف المستخدم' : 'Delete User'}
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* 1. CREATE USER MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={isArabic ? 'إضافة مستخدم جديد للنظام' : 'Create New User'}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-start">
          <Input
            label={isArabic ? 'الاسم الكامل *' : 'Full Name *'}
            placeholder={isArabic ? 'أحمد محمود' : 'Ahmed Mahmoud'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isArabic ? 'البريد الإلكتروني *' : 'Email *'}
              type="email"
              placeholder="user@fashionstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label={isArabic ? 'رقم الهاتف' : 'Phone'}
              placeholder="+201000000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Input
            label={isArabic ? 'كلمة المرور *' : 'Password *'}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isArabic ? 'الدور الوظيفي والصلاحيات' : 'Role & Permissions'}
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
            >
              {roles.map((r) => (
                <option key={r.id || r.name} value={r.name}>
                  {isArabic ? r.displayNameAr : r.displayNameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isCreating}>
              {isArabic ? 'إنشاء الحساب' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. EDIT USER MODAL */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={isArabic ? 'تعديل بيانات المستخدم والصلاحيات' : 'Edit User & Permissions'}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 text-start">
          <Input
            label={isArabic ? 'الاسم الكامل *' : 'Full Name *'}
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isArabic ? 'البريد الإلكتروني *' : 'Email *'}
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
            <Input
              label={isArabic ? 'رقم الهاتف' : 'Phone'}
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isArabic ? 'الدور الوظيفي' : 'Role'}
            </label>
            <select
              value={editRoleId}
              onChange={(e) => setEditRoleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
            >
              {roles.map((r) => (
                <option key={r.id || r.name} value={r.name}>
                  {isArabic ? r.displayNameAr : r.displayNameEn}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={isArabic ? 'تغيير كلمة المرور (اترك الحقل فارغاً إذا كنت لا تريد التغيير)' : 'Reset Password (Leave blank to keep current)'}
            type="password"
            placeholder="••••••••"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsActiveCheckbox"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="editIsActiveCheckbox" className="text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
              {isArabic ? 'الحساب نشط ويمكنه الدخول للوحة التحكم' : 'User account is active'}
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isUpdating}>
              {isArabic ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. DELETE USER MODAL */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title={isArabic ? 'تأكيد حذف المستخدم' : 'Confirm User Deletion'}
      >
        <div className="space-y-4 text-start">
          {deleteError && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold">
              {deleteError}
            </div>
          )}

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold">
              {isArabic
                ? `هل أنت متأكد من رغبتك في حذف المستخدم (${userToDelete?.fullName} - ${userToDelete?.email}) نهائياً؟ لن يتمكن من تسجيل الدخول بعد الآن.`
                : `Are you sure you want to permanently delete user (${userToDelete?.fullName})?`}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteUser}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>{isArabic ? 'نعم، احذف المستخدم' : 'Yes, Delete User'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
