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

            {/* Dynamic Social Icons */}
            {(() => {
              interface SocialItem {
                enabled: boolean;
                url: string;
              }
              let socialMap: Record<string, SocialItem | string> = {};
              try {
                if (settings.social_links) {
                  socialMap = JSON.parse(settings.social_links);
                }
              } catch {
                socialMap = {};
              }

              const PLATFORMS_CONFIG: Array<{
                key: string;
                name: string;
                defaultUrl: string;
                colorClass: string;
                bgClass: string;
                icon: React.ReactNode;
              }> = [
                {
                  key: 'instagram',
                  name: 'Instagram',
                  defaultUrl: 'https://instagram.com',
                  colorClass: 'hover:text-pink-500 hover:border-pink-500/40 dark:hover:text-pink-400',
                  bgClass: 'hover:bg-pink-50 dark:hover:bg-pink-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  ),
                },
                {
                  key: 'tiktok',
                  name: 'TikTok',
                  defaultUrl: 'https://tiktok.com',
                  colorClass: 'hover:text-cyan-500 hover:border-cyan-500/40 dark:hover:text-cyan-400',
                  bgClass: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.89-2.88 2.89 2.89 0 0 1 2.89-2.88c.37 0 .72.07 1.04.2v-3.56a6.37 6.37 0 0 0-1.04-.09 6.34 6.34 0 0 0-6.34 6.33 6.34 6.34 0 0 0 6.34 6.33 6.34 6.34 0 0 0 6.33-6.33V9.22a8.16 8.16 0 0 0 4.77 1.52V7.29a4.83 4.83 0 0 1-1.04-.6z"/>
                    </svg>
                  ),
                },
                {
                  key: 'facebook',
                  name: 'Facebook',
                  defaultUrl: 'https://facebook.com',
                  colorClass: 'hover:text-blue-600 hover:border-blue-500/40 dark:hover:text-blue-400',
                  bgClass: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  ),
                },
                {
                  key: 'whatsapp',
                  name: 'WhatsApp',
                  defaultUrl: `https://wa.me/${cleanPhone}`,
                  colorClass: 'hover:text-emerald-500 hover:border-emerald-500/40 dark:hover:text-emerald-400',
                  bgClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  ),
                },
                {
                  key: 'twitter',
                  name: 'X (Twitter)',
                  defaultUrl: 'https://x.com',
                  colorClass: 'hover:text-zinc-900 hover:border-zinc-900/40 dark:hover:text-white',
                  bgClass: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  icon: (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ),
                },
                {
                  key: 'snapchat',
                  name: 'Snapchat',
                  defaultUrl: 'https://snapchat.com',
                  colorClass: 'hover:text-amber-500 hover:border-amber-400 dark:hover:text-amber-400',
                  bgClass: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.005 0C6.91 0 5.405 3.738 5.405 5.433c0 .886.136 2.052.274 2.97.106.697-.17 1.096-.669 1.341-.54.267-1.32.327-1.745.385-.246.033-.424.238-.424.485 0 .428.472.766.97.94 1.109.387 2.006 1.036 2.006 2.247 0 .285-.05.656-.174 1.093-.263.929-.86 1.706-2.126 1.706-.52 0-.96.26-.96.652 0 .29.172.585.556.772 1.314.64 2.658.269 3.518-.08.435-.176.786-.039 1.002.261.428.594.88 1.48 1.488 1.48.243 0 .49-.126.837-.367.669-.465 1.542-.716 2.502-.716.96 0 1.833.251 2.502.716.347.241.594.367.837.367.608 0 1.06-.886 1.488-1.48.216-.3.567-.437 1.002-.261.86.349 2.204.72 3.518.08.384-.187.556-.482.556-.772 0-.392-.44-.652-.96-.652-1.266 0-1.863-.777-2.126-1.706-.124-.437-.174-.808-.174-1.093 0-1.211.897-1.86 2.006-2.247.498-.174.97-.512.97-.94 0-.247-.178-.452-.424-.485-.425-.058-1.205-.118-1.745-.385-.499-.245-.775-.644-.669-1.341.138-.918.274-2.084.274-2.97C18.605 3.738 17.1 0 12.005 0z"/>
                    </svg>
                  ),
                },
                {
                  key: 'youtube',
                  name: 'YouTube',
                  defaultUrl: 'https://youtube.com',
                  colorClass: 'hover:text-red-600 hover:border-red-500/40 dark:hover:text-red-400',
                  bgClass: 'hover:bg-red-50 dark:hover:bg-red-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  ),
                },
                {
                  key: 'telegram',
                  name: 'Telegram',
                  defaultUrl: 'https://t.me',
                  colorClass: 'hover:text-sky-500 hover:border-sky-500/40 dark:hover:text-sky-400',
                  bgClass: 'hover:bg-sky-50 dark:hover:bg-sky-950/30',
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  ),
                },
              ];

              const visiblePlatforms = PLATFORMS_CONFIG.filter((p) => {
                const settingVal = socialMap[p.key];
                if (!settingVal) return false;
                if (typeof settingVal === 'string') {
                  return settingVal.trim().length > 0;
                }
                return settingVal.enabled !== false && Boolean(settingVal.url?.trim());
              });

              if (visiblePlatforms.length === 0) {
                return null;
              }

              return (
                <div className="pt-4">
                  <span className="text-[11px] font-bold text-zinc-400 block mb-2.5">
                    {isArabic ? 'تابعنا على مواقع التواصل' : 'Follow our socials'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-zinc-500">
                    {visiblePlatforms.map((p) => {
                      const val = socialMap[p.key];
                      const href = typeof val === 'string' ? val : (val?.url || p.defaultUrl);
                      return (
                        <a
                          key={p.key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={p.name}
                          title={p.name}
                          className={`w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center transition-all duration-200 shadow-sm ${p.colorClass} ${p.bgClass} hover:scale-110 active:scale-95`}
                        >
                          {p.icon}
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Column: تسوق */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'تسوق' : 'Shop'}</h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
              <li><Link to="/shop" className="hover:text-black dark:hover:text-white">{isArabic ? 'المنتجات' : 'Products'}</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-black dark:hover:text-white">{isArabic ? 'جديدنا' : 'New In'}</Link></li>
              <li><Link to="/shop?sortBy=popular" className="hover:text-black dark:hover:text-white">{isArabic ? 'الأكثر مبيعاً' : 'Best Sellers'}</Link></li>
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
