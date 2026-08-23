import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../store/cartStore.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, getLocalized } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Trash2, ArrowRight, ShoppingBag, Tag, Check, X } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    items,
    totalItems,
    subtotal,
    appliedCoupon,
    discountPercent,
    discountAmount,
    finalTotal,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isArabic } = useTheme();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        title={isArabic ? 'سلة المشتريات فارغة' : 'Your Shopping Cart is Empty'}
        message={
          isArabic
            ? 'تصفح أحدث الأزياء وأضف منتجاتك المفضلة إلى السلة.'
            : 'Explore our new drops and add your favorite pieces to the cart.'
        }
        actionLabel={isArabic ? 'ابدأ التسوق الآن' : 'Start Shopping'}
        onAction={() => navigate('/shop')}
        icon={<ShoppingBag className="w-8 h-8" />}
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
      setCouponFeedback({ type: 'error', text: isArabic ? res.message : 'Invalid or expired promo code' });
    }
  };

  return (
    <div className="space-y-8 pb-20 text-start">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'سلة المشتريات' : 'Shopping Cart'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isArabic ? `${totalItems} منتج في السلة` : `${totalItems} items in your bag`}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
        >
          {isArabic ? 'تفريغ السلة' : 'Clear Cart'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const title = getLocalized(item.product.nameAr, item.product.nameEn, isArabic);
            const colorName = getLocalized(
              item.selectedColor.nameAr,
              item.selectedColor.nameEn,
              isArabic,
            );
            const sizeName = item.selectedSize.nameEn;
            const imgUrl =
              item.product.images[0]?.url ||
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80';

            return (
              <div
                key={item.variantId}
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <img
                    src={imgUrl}
                    alt={title}
                    className="w-20 h-24 object-cover rounded-xl shrink-0"
                  />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {colorName} / {sizeName}
                    </p>
                    <p className="text-xs font-semibold text-zinc-400">SKU: {item.variant.sku}</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 pt-1">
                      {formatPrice(Number(item.variant.price), 'EGP', isArabic)}
                    </p>
                  </div>
                </div>

                {/* Quantity + Remove */}
                <div className="flex flex-col items-end space-y-3">
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold">{item.quantity}</span>
                    <button
                      disabled={item.quantity >= item.variant.stockQuantity}
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="space-y-4">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              {isArabic ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            {/* Promo Code Input */}
            <div className="space-y-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? 'كوبون الخصم' : 'Promo Code'}</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <Check className="w-4 h-4" />
                    <span>{appliedCoupon} ({discountPercent}% {isArabic ? 'خصم' : 'OFF'})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-zinc-400 hover:text-red-500 transition"
                    title={isArabic ? 'إزالة الكوبون' : 'Remove Coupon'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={isArabic ? 'مثال: SUMMER15' : 'e.g. SUMMER15'}
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs uppercase font-bold tracking-wider outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                  <Button type="submit" size="sm" variant="secondary" isLoading={isApplying}>
                    {isArabic ? 'تطبيق' : 'Apply'}
                  </Button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[11px] font-bold ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponFeedback.text}
                </p>
              )}
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(subtotal, 'EGP', isArabic)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>{isArabic ? `خصم الكوبون (${discountPercent}%)` : `Promo Discount (${discountPercent}%)`}</span>
                  <span>-{formatPrice(discountAmount, 'EGP', isArabic)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{isArabic ? 'مصاريف الشحن' : 'Estimated Delivery'}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {subtotal >= 1000 ? (isArabic ? 'شحن مجاني 🔥' : 'Free Shipping 🔥') : (isArabic ? 'تحدد عند الدفع' : 'At checkout')}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
              <span>{isArabic ? 'الإجمالي النهائي' : 'Final Total'}</span>
              <span>{formatPrice(finalTotal, 'EGP', isArabic)}</span>
            </div>

            <Link to="/checkout" className="block w-full">
              <Button variant="gold" size="lg" className="w-full shadow-lg">
                <span>{isArabic ? 'متابعة الدفع والطلب' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
