import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../store/cartStore.js';
import { useTheme } from '../../store/themeStore.js';
import { ordersApi } from '../../api/index.js';
import { formatPrice, getLocalized } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { MessageCircle, ShieldCheck, Tag, X, Truck } from 'lucide-react';

const EGYPT_GOVERNORATES = [
  'القاهرة (Cairo)',
  'الجيزة (Giza)',
  'الإسكندرية (Alexandria)',
  'القليوبية (Qalyubia)',
  'الدقهلية (Mansoura / Dakahlia)',
  'الشرقية (Zagazig / Sharqia)',
  'الغربية (Tanta / Gharbia)',
  'المنوفية (Menofia)',
  'البحيرة (Beheira)',
  'كفر الشيخ (Kafr El Sheikh)',
  'دمياط (Damietta)',
  'بورسعيد (Port Said)',
  'الإسماعيلية (Ismailia)',
  'السويس (Suez)',
  'بني سويف (Beni Suef)',
  'الفيوم (Fayoum)',
  'المنيا (Minya)',
  'أسيوط (Asyut)',
  'سوهاج (Sohag)',
  'قنا (Qena)',
  'الأقصر (Luxor)',
  'أسوان (Aswan)',
  'البحر الأحمر (Red Sea / Hurghada)',
  'جنوب سيناء (Sharm El Sheikh)',
];

export const CheckoutPage: React.FC = () => {
  const {
    items,
    subtotal,
    appliedCoupon,
    discountPercent,
    discountAmount,
    finalTotal,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isArabic } = useTheme();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState(EGYPT_GOVERNORATES[0]);
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Shipping Calculation: Free above 1000 EGP, otherwise 50 EGP
  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const grandTotal = finalTotal + shippingFee;

  if (items.length === 0) {
    return (
      <EmptyState
        title={isArabic ? 'لا توجد منتجات للدفع' : 'No items to checkout'}
        message={
          isArabic ? 'يرجى إضافة منتجات إلى السلة أولاً.' : 'Please add items to your cart first.'
        }
        actionLabel={isArabic ? 'العودة للتسوق' : 'Back to Shop'}
        onAction={() => navigate('/shop')}
      />
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setCouponFeedback(null);

    const res = await applyCoupon(couponCode);
    setIsApplying(false);

    if (res.success) {
      setCouponFeedback({ type: 'success', text: isArabic ? res.message : `Applied ${res.discountPercent}% discount!` });
      setCouponCode('');
    } else {
      setCouponFeedback({ type: 'error', text: isArabic ? res.message : 'Invalid promo code' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg(isArabic ? 'يرجى إدخال اسم العميل' : 'Customer name is required');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMsg(isArabic ? 'يرجى إدخال رقم هاتف صحيح' : 'Valid phone number is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNotes = [
        notes.trim() || '',
        appliedCoupon ? `[كوبون مستخدم: ${appliedCoupon} - خصم ${discountPercent}%]` : '',
      ].filter(Boolean).join(' | ');

      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        notes: orderNotes || undefined,
        subtotal,
        discountAmount,
        discountPercent,
        appliedCoupon: appliedCoupon || undefined,
        shippingFee,
        totalAmount: grandTotal,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const res = await ordersApi.create(orderPayload);
      clearCart();

      // Navigate to success page with full order response
      navigate('/order/success', {
        state: {
          order: res.order,
          whatsappUrl: res.whatsappUrl,
        },
      });
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error).message || (isArabic ? 'فشل تأكيد الطلب' : 'Failed to submit order'),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-start max-w-4xl mx-auto">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'إتمام الطلب عبر واتساب' : 'Checkout & WhatsApp Order'}
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          {isArabic
            ? 'سجل بيانات التوصيل وسيتم إعداد رسالة طلب جاهزة للإرسال عبر واتساب.'
            : 'Fill in delivery details to automatically prepare your WhatsApp order message.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Delivery Form */}
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <Input
            label={isArabic ? 'الاسم الكامل *' : 'Full Name *'}
            placeholder={isArabic ? 'أحمد محمد' : 'John Doe'}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />

          <Input
            label={isArabic ? 'رقم الهاتف (واتساب) *' : 'Phone / WhatsApp Number *'}
            placeholder="+201012345678"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'المحافظة *' : 'Governorate *'}
              </label>
              <select
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-black"
              >
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={isArabic ? 'العنوان بالتفصيل *' : 'Street Address *'}
              placeholder={isArabic ? 'شارع التحرير، عمارة 12، شقة 4' : '15 Tahrir St, Apt 4'}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'ملاحظات إضافية' : 'Order Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isArabic ? 'مواعيد الاستلام المفضلة...' : 'Preferred delivery time...'}
              className="w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
            />
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isSubmitting}
            className="w-full shadow-xl mt-4"
          >
            <MessageCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
            <span>
              {isArabic
                ? `تأكيد الطلب بمبلغ ${formatPrice(grandTotal, 'EGP', isArabic)} عبر واتساب`
                : `Confirm Order (${formatPrice(grandTotal, 'EGP', isArabic)}) on WhatsApp`}
            </span>
          </Button>
        </form>

        {/* Order Summary Box with Promo Code */}
        <div className="space-y-4">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              {isArabic ? 'عناصر الطلب' : 'Order Items'}
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto">
              {items.map((i) => (
                <div key={i.variantId} className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 line-clamp-1">
                    {getLocalized(i.product.nameAr, i.product.nameEn, isArabic)} (x{i.quantity})
                  </span>
                  <span className="font-bold shrink-0">
                    {formatPrice(Number(i.variant.price) * i.quantity, 'EGP', isArabic)}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Coupon in Checkout */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" />
                <span>{isArabic ? 'كوبون الخصم' : 'Promo Code'}</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs">
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    {appliedCoupon} (-{discountPercent}%)
                  </span>
                  <button onClick={removeCoupon} className="text-zinc-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={isArabic ? 'كود الخصم' : 'Code'}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs uppercase font-bold outline-none"
                  />
                  <Button type="submit" size="sm" variant="secondary" isLoading={isApplying}>
                    {isArabic ? 'تطبيق' : 'Apply'}
                  </Button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[10px] font-bold ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponFeedback.text}
                </p>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span>{formatPrice(subtotal, 'EGP', isArabic)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>{isArabic ? 'الخصم' : 'Discount'}</span>
                  <span>-{formatPrice(discountAmount, 'EGP', isArabic)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-zinc-400" />
                  <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
                </span>
                <span>
                  {shippingFee === 0
                    ? (isArabic ? 'مجاني' : 'Free')
                    : formatPrice(shippingFee, 'EGP', isArabic)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm font-black text-zinc-900 dark:text-zinc-100">
              <span>{isArabic ? 'الإجمالي المطلوب' : 'Grand Total'}</span>
              <span className="text-base">{formatPrice(grandTotal, 'EGP', isArabic)}</span>
            </div>

            <div className="pt-2 text-center text-[11px] text-zinc-400 flex items-center justify-center space-x-1 rtl:space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{isArabic ? 'معاينة عند الاستلام ودفع نقدي' : 'Cash on delivery with inspection'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
