import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sheinApi } from '../../api/index.js';
import { SheinExtractResult, SheinPricingConfig } from '../../types/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import {
  Link as LinkIcon,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  MessageCircle,
  Clock,
} from 'lucide-react';

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

interface CartSheinItem {
  id: string;
  productUrl: string;
  title: string;
  color: string;
  size: string;
  unitPrice: number;
  priceSar?: number;
  quantity: number;
  notes: string;
}

export const SheinOrderPage: React.FC = () => {
  const { isArabic } = useTheme();
  const navigate = useNavigate();

  // Pricing configuration loaded from API / StoreSettings
  const [pricing, setPricing] = useState<SheinPricingConfig>({
    enabled: true,
    shippingFee: 100,
    serviceFee: 75,
    deliveryFee: 60,
    exchangeRate: 13.2,
    estimatedDays: '10-15 يوم عمل',
    whatsappNumber: '+201234567890',
  });

  // Extraction State
  // Extraction State
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null);

  // Current Active Extracted Product
  const [currentProduct, setCurrentProduct] = useState<SheinExtractResult | null>(null);
  const [productTitle, setProductTitle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('حسب الرابط');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [manualPrice, setManualPrice] = useState<number>(0);

  // Currency Selection for Price on SHEIN (SAR - ريال سعودي, EGP - جنيه)
  const [inputCurrency, setInputCurrency] = useState<'SAR' | 'EGP'>('SAR');
  const [inputPriceValue, setInputPriceValue] = useState<string>('');

  // Cart of Items in the current order
  const [cartItems, setCartItems] = useState<CartSheinItem[]>([]);

  // Customer Delivery Form State (Matching CheckoutPage standard)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState(EGYPT_GOVERNORATES[0]);
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real pricing config on mount
  useEffect(() => {
    sheinApi
      .getPricing()
      .then((res) => {
        if (res) setPricing(res);
      })
      .catch((err) => {
        console.warn('Failed to load SHEIN pricing config:', err);
      });
  }, []);

  // Convert currency (SAR to EGP)
  const updatePriceWithCurrency = (valStr: string, curr: 'SAR' | 'EGP') => {
    setInputPriceValue(valStr);
    setInputCurrency(curr);
    const num = parseFloat(valStr) || 0;
    if (num <= 0) {
      setManualPrice(0);
      return;
    }

    if (curr === 'SAR') {
      const sarRate = pricing.exchangeRate > 1 ? pricing.exchangeRate : 13.2;
      const convertedEgp = Math.round(num * sarRate);
      setManualPrice(convertedEgp);
    } else {
      setManualPrice(Math.round(num));
    }
  };

  // Handle URL Extraction
  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setExtractError(isArabic ? 'يرجى إدخال رابط منتج من SHEIN أولاً' : 'Please enter a SHEIN product URL');
      setExtractSuccessMsg(null);
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccessMsg(null);

    try {
      const res = await sheinApi.extractMetadata(cleanUrl);
      setCurrentProduct(res);
      setProductTitle(res.title || '');
      setSelectedSize(res.sizes?.[0] || 'M');
      setSelectedColor(isArabic ? 'حسب الرابط' : 'As in link');
      setQuantity(1);
      setItemNotes('');

      if (res.estimatedPriceEgp && res.estimatedPriceEgp > 0) {
        setManualPrice(res.estimatedPriceEgp);
        setInputPriceValue(String(res.originalPrice || res.estimatedPriceEgp));
        setInputCurrency(res.currency === 'SAR' ? 'SAR' : 'EGP');
      } else {
        setInputPriceValue('');
        setManualPrice(0);
        setInputCurrency('SAR');
      }

      setExtractSuccessMsg(
        res.message || (isArabic ? 'تم التحقق من الرابط بنجاح! راجع اسم ومواصفات القطعة أدناه.' : 'Link verified successfully! Check details below.')
      );
    } catch (err: any) {
      setExtractError(
        err?.message || (isArabic ? 'تعذر جلب بيانات الرابط. تأكد من صحة رابط SHEIN' : 'Failed to fetch link details'),
      );
      setExtractSuccessMsg(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Add current extracted product to the order list
  const handleAddItemToCart = () => {
    if (!currentProduct && !urlInput.trim()) return;

    const price = manualPrice > 0 ? manualPrice : (currentProduct?.estimatedPriceEgp || 0);
    if (price <= 0) {
      alert(isArabic ? 'يرجى كتابة سعر القطعة المعروض على SHEIN' : 'Please specify the item price');
      return;
    }

    const sarRate = pricing.exchangeRate > 1 ? pricing.exchangeRate : 13.2;
    const priceSar = inputCurrency === 'SAR' && parseFloat(inputPriceValue) > 0
      ? parseFloat(inputPriceValue)
      : Math.round((price / sarRate) * 100) / 100;

    const newItem: CartSheinItem = {
      id: Math.random().toString(36).substring(2, 9),
      productUrl: currentProduct?.url || urlInput.trim(),
      title: productTitle.trim() || currentProduct?.title || (isArabic ? 'منتج من SHEIN' : 'SHEIN Product'),
      color: selectedColor || (isArabic ? 'حسب الرابط' : 'As in link'),
      size: selectedSize || 'Free Size',
      unitPrice: price,
      priceSar,
      quantity: Math.max(1, quantity),
      notes: itemNotes.trim(),
    };

    setCartItems((prev) => [...prev, newItem]);

    // Reset current active preview to allow pasting next URL
    setCurrentProduct(null);
    setProductTitle('');
    setUrlInput('');
    setItemNotes('');
    setSelectedColor('حسب الرابط');
    setInputPriceValue('');
    setManualPrice(0);
    setExtractSuccessMsg(null);
  };

  // Remove item from cart
  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate Subtotals & Totals directly from products & converted currency (NO hidden fees breakdown!)
  const sarRate = pricing.exchangeRate > 1 ? pricing.exchangeRate : 13.2;
  const hasActiveProduct = Boolean(currentProduct);
  const activeProductPrice = manualPrice > 0 ? manualPrice : (currentProduct?.estimatedPriceEgp || 0);
  const activeProductSar = inputCurrency === 'SAR' && parseFloat(inputPriceValue) > 0
    ? parseFloat(inputPriceValue)
    : Math.round((activeProductPrice / sarRate) * 100) / 100;
  const activeProductSubtotal = hasActiveProduct ? activeProductPrice * Math.max(1, quantity) : 0;

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const productsTotal = cartSubtotal + activeProductSubtotal;

  const totalSar = cartItems.reduce((acc, item) => acc + (item.priceSar || (item.unitPrice / sarRate)) * item.quantity, 0)
    + (hasActiveProduct ? activeProductSar * Math.max(1, quantity) : 0);

  const hasAnyItems = cartItems.length > 0 || (hasActiveProduct && activeProductPrice > 0);

  // Grand total is the direct converted amount in EGP (no extra fee inflation)
  const grandTotal = (productsTotal > 0 || hasAnyItems) ? productsTotal : 0;

  // Handle Order Submission - Same behavior and flow as CheckoutPage
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const allItems = [...cartItems];

    if (currentProduct) {
      const price = manualPrice > 0 ? manualPrice : (currentProduct.estimatedPriceEgp || 0);
      if (price > 0) {
        allItems.push({
          id: 'active',
          productUrl: currentProduct.url,
          title: productTitle.trim() || currentProduct.title || (isArabic ? 'منتج من SHEIN' : 'SHEIN Product'),
          color: selectedColor || (isArabic ? 'حسب الرابط' : 'As in link'),
          size: selectedSize || 'Free Size',
          unitPrice: price,
          quantity,
          notes: itemNotes,
        });
      }
    }

    if (allItems.length === 0) {
      setErrorMsg(isArabic ? 'يرجى إدخال رابط منتج وتحديد سعره لإتمام الطلب' : 'Please add at least one SHEIN item');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg(isArabic ? 'يرجى إدخال اسم العميل' : 'Customer name is required');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMsg(isArabic ? 'يرجى إدخال رقم هاتف صحيح للتواصل عبر واتساب' : 'Valid phone number is required');
      return;
    }

    if (!customerAddress.trim()) {
      setErrorMsg(isArabic ? 'يرجى إدخال العنوان بالتفصيل' : 'Street address is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        paymentMethod: 'CASH_ON_DELIVERY',
        notes: orderNotes.trim() || undefined,
        items: allItems.map((item) => ({
          productUrl: item.productUrl,
          title: item.title,
          color: item.color || null,
          size: item.size || null,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      };

      const res = await sheinApi.createOrder(payload);

      // Navigate directly to standard OrderSuccessPage - EXACT SAME BEHAVIOR AS STORE CHECKOUT!
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
      {/* 1. Page Header (Consistent with CheckoutPage & Storefront) */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'طلب منتجات من SHEIN' : 'Order From SHEIN'}
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          {isArabic
            ? 'الصق رابط المنتج من SHEIN وسنتكفل بالشراء والتخليص الجمركي والتوصيل لباب بيتك مع إتمام الطلب عبر واتساب.'
            : 'Paste your SHEIN item link and we will handle purchasing, customs, and delivery with WhatsApp confirmation.'}
        </p>
      </div>

      {/* 2. Link Extraction Input Box */}
      <div className="p-5 sm:p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <span>{isArabic ? 'رابط المنتج من SHEIN *' : 'SHEIN Product Link *'}</span>
        </label>

        <form onSubmit={handleExtract} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={
                isArabic
                  ? 'الصق رابط المنتج هنا... (مثال: https://m.shein.com/ar/...)'
                  : 'Paste SHEIN product URL here...'
              }
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            isLoading={isExtracting}
            className="shrink-0"
          >
            <span>{isArabic ? 'جلب بيانات المنتج' : 'Extract Product'}</span>
          </Button>
        </form>

        {extractSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/60">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{extractSuccessMsg}</span>
          </div>
        )}

        {extractError && (
          <div className="p-3.5 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      {/* 3. Main Grid: Left Form (2 cols) & Right Order Summary (1 col) - Matching CheckoutPage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Extracted Product Customization & Customer Delivery Form */}
        <div className="md:col-span-2 space-y-6">
          {/* A. Current Extracted Product Box */}
          {currentProduct && (
            <div className="p-5 sm:p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {isArabic ? 'الرابط معتمد وجاهز' : 'Product Link Ready'}
                  </span>
                </div>
                <a
                  href={currentProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline flex items-center gap-1"
                >
                  <span>{isArabic ? 'فتح الرابط في SHEIN' : 'View on SHEIN'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Editable Product Title & Goods ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {isArabic ? 'اسم أو وصف القطعة المطلوب شراؤها *' : 'Item Name / Description *'}
                  </label>
                  {currentProduct.goodsId && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      #{currentProduct.goodsId}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder={isArabic ? 'اكتب اسم القطعة (مثال: فستان سهرة أحمر، تيشيرت...)' : 'Enter item name...'}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition"
                  required
                />
              </div>

              {/* Price & Currency Switcher Row */}
              <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 block">
                      {isArabic ? 'السعر المحسوب بالجنيه:' : 'Calculated Price in EGP:'}
                    </span>
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {manualPrice > 0 ? manualPrice : (currentProduct.estimatedPriceEgp || '0')} ج.م
                    </span>
                  </div>

                  {inputCurrency === 'SAR' && parseFloat(inputPriceValue) > 0 && (
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      🇸🇦 {inputPriceValue} ريال
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {isArabic ? 'سعر القطعة على SHEIN (ريال أو جنيه): *' : 'Item Price on SHEIN: *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0.1}
                      value={inputPriceValue}
                      onChange={(e) => updatePriceWithCurrency(e.target.value, inputCurrency)}
                      placeholder={
                        inputCurrency === 'SAR'
                          ? (isArabic ? 'اكتب السعر بالريال (مثال: 55)...' : 'Price in SAR...')
                          : (isArabic ? 'اكتب السعر بالجنيه (مثال: 720)...' : 'Price in EGP...')
                      }
                      className="flex-1 px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-900"
                    />

                    <div className="flex rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shrink-0">
                      <button
                        type="button"
                        onClick={() => updatePriceWithCurrency(inputPriceValue, 'SAR')}
                        className={`px-3 py-1.5 text-xs font-bold transition ${inputCurrency === 'SAR'
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                      >
                        🇸🇦 ريال
                      </button>

                      <button
                        type="button"
                        onClick={() => updatePriceWithCurrency(inputPriceValue, 'EGP')}
                        className={`px-3 py-1.5 text-xs font-bold transition ${inputCurrency === 'EGP'
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                      >
                        🇪🇬 جنيه
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {isArabic ? 'المقاس المطلوب *' : 'Size *'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedSize === sz
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                        }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {isArabic ? 'اللون المطلوب *' : 'Color *'}
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {['حسب الرابط', 'أسود', 'أبيض', 'بيج', 'أحمر', 'كحلي / أزرق'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${selectedColor === col
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                          }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder={isArabic ? 'أو اكتب اللون هنا...' : 'Or type color here...'}
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {isArabic ? 'الكمية' : 'Quantity'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 font-bold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 transition"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-zinc-900 dark:text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 font-bold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes for item */}
              <Input
                label={isArabic ? 'ملاحظة خاصة بالقطعة (اختياري)' : 'Item Notes (Optional)'}
                placeholder={isArabic ? 'أي تفاصيل خاصة بالقطعة...' : 'Any instructions...'}
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />

              {/* Add item to list button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItemToCart}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                <span>{isArabic ? 'إضافة القطعة للطلب وطلب قطعة أخرى' : 'Add Item & Add Another'}</span>
              </Button>
            </div>
          )}

          {/* B. Multi-Items List */}
          {cartItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {isArabic ? `المنتجات المضافة (${cartItems.length})` : `Added Items (${cartItems.length})`}
              </h3>

              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</div>
                      <div className="text-zinc-500 mt-0.5">
                        المقاس: {item.size} | اللون: {item.color} | الكمية: {item.quantity}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="font-bold font-mono text-zinc-900 dark:text-zinc-100">{item.unitPrice * item.quantity} ج.م</div>
                      {item.priceSar && (
                        <div className="text-[10px] text-zinc-400 font-mono">
                          🇸🇦 {(item.priceSar * item.quantity).toFixed(1)} ر.س
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. Delivery Form (Same fields & behavior as CheckoutPage) */}
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              {isArabic ? 'بيانات التوصيل والتواصل' : 'Delivery Details'}
            </h3>

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
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={isArabic ? 'مواعيد الاستلام المفضلة أو أي تعليمات خاصة...' : 'Preferred delivery time...'}
                className="w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
              />
            </div>

            {/* Submit Button (Matching CheckoutPage variant="gold" / MessageCircle) */}
            <Button
              type="submit"
              variant="gold"
              size="lg"
              isLoading={isSubmitting}
              disabled={!hasAnyItems && cartItems.length === 0}
              className="w-full shadow-xl mt-4"
            >
              <MessageCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              <span>
                {isArabic
                  ? `تأكيد طلب SHEIN (${formatPrice(grandTotal, 'EGP', isArabic)}${totalSar > 0 ? ` / ~${totalSar.toFixed(1)} ر.س` : ''}) عبر واتساب`
                  : `Confirm SHEIN Order (${formatPrice(grandTotal, 'EGP', isArabic)}${totalSar > 0 ? ` / ~${totalSar.toFixed(1)} SAR` : ''}) on WhatsApp`}
              </span>
            </Button>
          </form>
        </div>

        {/* Right Column: Clean Order Summary Box - Direct SAR & EGP, NO extra fees breakdown */}
        <div className="space-y-4">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span>{isArabic ? 'ملخص الطلب والتسعير' : 'Order & Price Summary'}</span>
              <span className="text-[11px] font-normal text-zinc-500">
                {cartItems.length + (hasActiveProduct ? 1 : 0)} {isArabic ? 'قطع' : 'items'}
              </span>
            </h3>

            {/* Price in SAR & Converted to EGP */}
            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between items-center">
                <span>{isArabic ? 'السعر بالريال السعودي:' : 'Price in SAR:'}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                  🇸🇦 {totalSar > 0 ? totalSar.toFixed(2) : '0.00'} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60">
                <span>{isArabic ? 'معامل التحويل (سعر الصرف):' : 'Exchange Rate:'}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  1 ر.س = {sarRate} ج.م
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span>{isArabic ? 'السعر المحول بالجنيه المصري:' : 'Converted to EGP:'}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatPrice(productsTotal, 'EGP', isArabic)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm font-black text-zinc-900 dark:text-zinc-100">
              <span>{isArabic ? 'الإجمالي المطلوب للدفع' : 'Grand Total'}</span>
              <div className="text-end">
                <span className="text-base text-zinc-900 dark:text-zinc-100 block">{formatPrice(grandTotal, 'EGP', isArabic)}</span>
                {totalSar > 0 && (
                  <span className="text-[10px] text-zinc-400 font-mono font-bold block">
                    (~{totalSar.toFixed(1)} ر.س)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-zinc-400 flex items-center justify-center space-x-1 rtl:space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{isArabic ? 'معاينة عند الاستلام ودفع نقدي' : 'Cash on delivery with inspection'}</span>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isArabic ? `مدة التوصيل: ${pricing.estimatedDays}` : `Delivery: ${pricing.estimatedDays}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
