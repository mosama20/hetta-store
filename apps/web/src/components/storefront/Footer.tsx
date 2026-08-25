import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Mail, MapPin, Smartphone } from 'lucide-react';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { triggerAppInstallPrompt } from './MobileAppInstallPrompt.js';

export const Footer: React.FC = () => {
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const storeName = isArabic
    ? settings.store_name_ar || 'CRAFT'
    : settings.store_name_en || 'CRAFT';
  const whatsappNumber = settings.whatsapp_number || '+20 123 456 7890';
  const supportEmail = settings.support_email || 'hello@craftwear.com';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <footer className="w-full bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-t border-zinc-200/80 dark:border-zinc-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 text-start">
          {/* Newsletter Signup (2 Columns) */}
          <div className="md:col-span-2 space-y-3">
            {settings.store_logo ? (
              <img
                src={settings.store_logo}
                alt={storeName}
                className="h-8 md:h-9 w-auto max-w-[160px] object-contain mb-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {storeName}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isArabic
                ? 'كن أول من يعرف عن العروض والتشكيلات الحصرية الجديدة'
                : 'Be the first to know about new drops and exclusive offers.'}
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center space-x-2 rtl:space-x-reverse max-w-sm pt-2">
              <input
                type="email"
                required
                placeholder={isArabic ? 'اكتب بريدك الإلكتروني...' : 'Enter your email...'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black"
              />
              <button
                type="submit"
                className="p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:bg-zinc-800 transition"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
            {subscribed && (
              <p className="text-emerald-600 text-[11px] font-bold">
                {isArabic ? 'شكراً لاشتراكك في نشرتنا!' : 'Thank you for subscribing!'}
              </p>
            )}

            {/* Social Icons */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse pt-4 text-zinc-500">
              <a href="https://instagram.com/craft.wear" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white">
                Instagram
              </a>
              <a href="https://tiktok.com/@craftwear" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white">
                TikTok
              </a>
              <a href="https://facebook.com/craftwear" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white">
                Facebook
              </a>
            </div>
          </div>

          {/* Column: تسوق */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'تسوق' : 'Shop'}</h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
              <li><Link to="/shop" className="hover:text-black dark:hover:text-white">{isArabic ? 'جميع المنتجات' : 'All Products'}</Link></li>
              <li><Link to="/shop" className="hover:text-black dark:hover:text-white">{isArabic ? 'المجموعات' : 'Collections'}</Link></li>
              <li><Link to="/shop?sortBy=popular" className="hover:text-black dark:hover:text-white">{isArabic ? 'الأكثر مبيعاً' : 'Best Sellers'}</Link></li>
              <li><Link to="/shop?sortBy=newest" className="hover:text-black dark:hover:text-white">{isArabic ? 'جديدنا' : 'New In'}</Link></li>
            </ul>
          </div>

          {/* Column: مساعدة */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'مساعدة' : 'Help'}</h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
              <li><Link to="/shipping" className="hover:text-black dark:hover:text-white">{isArabic ? 'سياسة الشحن' : 'Shipping Policy'}</Link></li>
              <li><Link to="/returns" className="hover:text-black dark:hover:text-white">{isArabic ? 'سياسة الإرجاع' : 'Returns Policy'}</Link></li>
              <li><Link to="/faq" className="hover:text-black dark:hover:text-white">{isArabic ? 'الأسئلة الشائعة' : 'FAQs'}</Link></li>
              <li><Link to="/about" className="hover:text-black dark:hover:text-white">{isArabic ? 'عن المتجر' : 'About Us'}</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => triggerAppInstallPrompt()}
                  className="hover:text-amber-500 font-semibold transition inline-flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isArabic ? 'تثبيت تطبيق المتجر' : 'Install Store App'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column: تواصل معنا */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'تواصل معنا' : 'Contact Us'}</h4>
            <div className="space-y-2 text-zinc-500 dark:text-zinc-400 text-xs">
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-600 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{whatsappNumber}</span>
              </a>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Mail className="w-3.5 h-3.5" />
                <span>{supportEmail}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-3.5 h-3.5" />
                <span>{isArabic ? 'القاهرة، مصر' : 'Cairo, Egypt'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} {storeName}. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex items-center space-x-3 rtl:space-x-reverse font-bold text-zinc-600 dark:text-zinc-400">
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>InstaPay</span>
            <span>•</span>
            <span>WhatsApp Order</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
