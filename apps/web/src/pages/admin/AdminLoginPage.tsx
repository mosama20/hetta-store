import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Card } from '../../components/common/Card.js';
import { Lock, Shield, KeyRound, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/index.js';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();

  const [email, setEmail] = useState('mohamed.osama5060@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('mohamed.osama5060@gmail.com');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [generatedCodeHint, setGeneratedCodeHint] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login({ email: email.trim(), password });
      navigate('/admin');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('Network error') || msg.includes('Failed to fetch')) {
        setErrorMsg(
          isArabic
            ? 'سيرفر الـ API في حالة بدء تشغيل (Cold Start) أو غير متصل. يرجى الانتظار بضع ثوانٍ وإعادة المحاولة.'
            : 'API server is waking up or unreachable. Please wait a few seconds and try again.',
        );
      } else if (msg.includes('Invalid') || msg.includes('Unauthorized') || msg.includes('credentials')) {
        setErrorMsg(
          isArabic
            ? 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور أو استخدام "نسيت كلمة المرور".'
            : 'Invalid email or password. Please check your credentials or click "Forgot Password".',
        );
      } else {
        setErrorMsg(msg || (isArabic ? 'فشل تسجيل الدخول' : 'Login failed'));
      }
      setIsLoading(false);
    }
  };

  // Handle Send Reset Code (Step 1)
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    setGeneratedCodeHint('');

    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      setForgotSuccess(
        isArabic
          ? 'تم إصدار كود الاستعادة بنجاح. يرجى إدخال الكود وكلمة المرور الجديدة.'
          : 'Reset code generated successfully. Please enter the code and new password.',
      );
      if (res.resetCode) {
        setGeneratedCodeHint(res.resetCode);
        setResetCode(res.resetCode);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError((err as Error)?.message || (isArabic ? 'حدث خطأ أثناء طلب الاستعادة' : 'Error requesting reset code'));
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Confirm Reset Password (Step 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setForgotError(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError(isArabic ? 'كلمة المرور يجب أن لا تقل عن 8 أحرف' : 'Password must be at least 8 characters');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      await authApi.resetPassword({
        email: forgotEmail.trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });

      setForgotSuccess(
        isArabic
          ? 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
          : 'Password changed successfully! You can now login with your new password.',
      );
      setPassword(newPassword);
      setEmail(forgotEmail.trim());

      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setForgotError((err as Error)?.message || (isArabic ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password'));
    } finally {
      setForgotLoading(false);
    }
  };

  const storeName = isArabic ? settings.store_name_ar || 'FASHION STORE' : settings.store_name_en || 'FASHION STORE';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md p-8 bg-zinc-900/90 backdrop-blur-xl border-zinc-800 space-y-6 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          {settings.store_logo ? (
            <div className="flex justify-center mb-3">
              <img
                src={settings.store_logo}
                alt={storeName}
                className="h-12 w-auto max-w-[200px] object-contain rounded"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight">{storeName}</h1>
          <p className="text-xs text-zinc-400">
            {isArabic ? 'تسجيل الدخول إلى لوحة الإدارة' : 'Sign in to management console'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs font-semibold text-start flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <Input
            label={isArabic ? 'البريد الإلكتروني' : 'Email Address'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mohamed.osama5060@gmail.com"
            required
          />

          <div className="space-y-1">
            <Input
              label={isArabic ? 'كلمة المرور' : 'Password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || 'mohamed.osama5060@gmail.com');
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                  setGeneratedCodeHint('');
                  setIsForgotModalOpen(true);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 transition font-medium underline-offset-4 hover:underline"
              >
                {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full shadow-xl mt-4"
          >
            <Lock className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            <span>{isArabic ? 'دخول لوحة التحكم' : 'Sign In'}</span>
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-zinc-300 transition flex items-center justify-center gap-1 mx-auto"
          >
            {isArabic ? (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة إلى المتجر</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Storefront</span>
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-zinc-900 border-zinc-800 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isArabic ? 'استعادة كلمة المرور' : 'Reset Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-semibold flex items-start gap-2 text-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-start gap-2 text-start">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4 text-start">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isArabic
                    ? 'أدخل البريد الإلكتروني الخاص بحسابك الإداري لإنشاء كود التحقق لاستعادة كلمة المرور.'
                    : 'Enter your administrative email address to generate a recovery code.'}
                </p>

                <Input
                  label={isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="mohamed.osama5060@gmail.com"
                  required
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="gold"
                    isLoading={forgotLoading}
                    className="w-full"
                  >
                    <span>{isArabic ? 'إرسال كود الاستعادة' : 'Send Recovery Code'}</span>
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-start">
                {generatedCodeHint && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <span className="font-bold">{isArabic ? 'كود الاستعادة الخاص بك:' : 'Your Reset Code:'} </span>
                    <span className="font-mono font-bold tracking-widest text-amber-200">{generatedCodeHint}</span>
                  </div>
                )}

                <Input
                  label={isArabic ? 'كود التحقق (أو كود الطوارئ CRAFT2026)' : 'Reset Code'}
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  required
                />

                <Input
                  label={isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Input
                  label={isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setForgotStep(1)}
                    disabled={forgotLoading}
                    className="w-1/3"
                  >
                    <span>{isArabic ? 'السابق' : 'Back'}</span>
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    isLoading={forgotLoading}
                    className="w-2/3"
                  >
                    <span>{isArabic ? 'تأكيد وتعيين كلمة المرور' : 'Confirm & Reset'}</span>
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
