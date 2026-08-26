import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, Sun, Moon, ChevronDown, Sparkles, CheckCircle2, Smartphone } from 'lucide-react';
import { useCart, CART_ITEM_ADDED_EVENT } from '../../store/cartStore.js';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings, STORE_SYNC_EVENT } from '../../store/settingsStore.js';
import { categoriesApi } from '../../api/index.js';
import { Category } from '../../types/index.js';
import { getLocalized } from '../../utils/formatters.js';
import { triggerAppInstallPrompt } from './MobileAppInstallPrompt.js';

export const Header: React.FC = () => {
  const { totalItems } = useCart();
  const { isArabic, toggleLanguage, isDark, toggleTheme } = useTheme();
  const { settings } = useStoreSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart Bouncing Attention State
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{ name: string; img?: string } | null>(null);

  const loadCategories = () => {
    categoriesApi
      .getAll()
      .then((data) => setCategories(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadCategories();
    const handleSync = () => {
      loadCategories();
    };
    window.addEventListener(STORE_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(STORE_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Listen for items added to the cart to trigger the bouncing animation
  useEffect(() => {
    let bounceTimer: NodeJS.Timeout;
    let popupTimer: NodeJS.Timeout;

    const handleItemAdded = (e: Event) => {
      const customEvent = e as CustomEvent<{ product?: { nameAr: string; nameEn: string; images?: { url: string }[] } }>;
      setIsCartBouncing(true);
      setShowCartPopup(true);

      if (customEvent.detail?.product) {
        setLastAddedItem({
          name: isArabic ? customEvent.detail.product.nameAr : customEvent.detail.product.nameEn,
          img: customEvent.detail.product.images?.[0]?.url,
        });
      }

      clearTimeout(bounceTimer);
      clearTimeout(popupTimer);

      // Keep bouncing to catch buyer's attention, stopping after 9 seconds or on user interaction
      bounceTimer = setTimeout(() => {
        setIsCartBouncing(false);
      }, 9000);

      popupTimer = setTimeout(() => {
        setShowCartPopup(false);
      }, 4500);
    };

    window.addEventListener(CART_ITEM_ADDED_EVENT, handleItemAdded);
    return () => {
      window.removeEventListener(CART_ITEM_ADDED_EVENT, handleItemAdded);
      clearTimeout(bounceTimer);
      clearTimeout(popupTimer);
    };
  }, [isArabic]);

  // Stop bouncing if user visits the cart page
  useEffect(() => {
    if (location.pathname === '/cart') {
      setIsCartBouncing(false);
      setShowCartPopup(false);
    }
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const storeName = isArabic ? settings.store_name_ar || 'CRAFT' : settings.store_name_en || 'CRAFT';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-18 lg:h-20">
          {/* 1. Left: Brand Logo & Mobile menu button */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              {settings.store_logo ? (
                <img
                  src={settings.store_logo}
                  alt={storeName}
                  className="h-8 sm:h-10 lg:h-11 w-auto max-w-[150px] sm:max-w-[200px] object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to text if image fails
                    e.currentTarget.style.display = 'none';
                    const fallbackEl = document.getElementById('header-store-text-fallback');
                    if (fallbackEl) fallbackEl.style.display = 'block';
                  }}
                />
              ) : null}
              <span
                id="header-store-text-fallback"
                className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest text-zinc-900 dark:text-zinc-100 font-sans uppercase ${
                  settings.store_logo ? 'hidden' : 'block'
                }`}
              >
                {storeName}
              </span>
            </Link>
          </div>

          {/* 2. Center: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <Link
              to="/"
              className={`py-2 hover:text-black dark:hover:text-white transition-colors ${
                location.pathname === '/' ? 'text-black dark:text-white font-bold' : ''
              }`}
            >
              {isArabic ? 'الرئيسية' : 'Home'}
            </Link>

            <Link
              to="/shop"
              className={`py-2 hover:text-black dark:hover:text-white transition-colors ${
                location.pathname === '/shop' ? 'text-black dark:text-white font-bold' : ''
              }`}
            >
              {isArabic ? 'المنتجات' : 'Products'}
            </Link>

            <Link
              to="/new-arrivals"
              className={`flex items-center space-x-1 rtl:space-x-reverse py-2 hover:text-black dark:hover:text-white transition-colors ${
                location.pathname === '/new-arrivals' ? 'text-black dark:text-white font-bold' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isArabic ? 'جديدنا' : 'New In'}</span>
            </Link>

            <Link
              to="/about"
              className={`py-2 hover:text-black dark:hover:text-white transition-colors ${
                location.pathname === '/about' ? 'text-black dark:text-white font-bold' : ''
              }`}
            >
              {isArabic ? `عن ${storeName}` : `About ${storeName}`}
            </Link>
          </nav>

          {/* 3. Right: Utility Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2.5 rtl:space-x-reverse text-zinc-800 dark:text-zinc-200">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1.5 sm:p-2 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition"
              title={isArabic ? 'بحث' : 'Search'}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </button>

            {/* Dark/Light Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition text-amber-500 dark:text-amber-400"
              title={
                isDark
                  ? isArabic
                    ? 'الوضع المضيء'
                    : 'Light Mode'
                  : isArabic
                    ? 'الوضع الليلي'
                    : 'Dark Mode'
              }
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 dark:text-zinc-200" />
              )}
            </button>

            {/* Admin / Account Icon */}
            <Link
              to="/admin/login"
              className="p-1.5 sm:p-2 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition"
              title={isArabic ? 'لوحة التحكم' : 'Admin Panel'}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </Link>

            {/* Bouncing Cart Icon & Toast Popup Container */}
            <div className="relative">
              <Link
                to="/cart"
                onClick={() => {
                  setIsCartBouncing(false);
                  setShowCartPopup(false);
                }}
                className={`relative p-1.5 sm:p-2 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition flex items-center justify-center ${
                  isCartBouncing
                    ? 'animate-cart-bounce text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400'
                    : ''
                }`}
                title={isArabic ? 'سلة المشتريات' : 'Shopping Cart'}
              >
                <ShoppingBag
                  className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2] transition-colors ${
                    isCartBouncing ? 'text-amber-500 fill-amber-500/20' : ''
                  }`}
                />
                {totalItems > 0 && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow transition-all ${
                      isCartBouncing
                        ? 'bg-amber-500 text-black animate-badge-pulse font-black'
                        : 'bg-black dark:bg-white text-white dark:text-black'
                    }`}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Added to Cart Floating Popup */}
              {showCartPopup && (
                <div className="absolute top-full end-0 mt-2.5 w-64 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-start space-y-2.5">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{isArabic ? 'تمت إضافة المنتج للسلة بنجاح!' : 'Added to cart!'}</span>
                  </div>
                  {lastAddedItem && (
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse pt-0.5">
                      {lastAddedItem.img && (
                        <img
                          src={lastAddedItem.img}
                          alt=""
                          className="w-10 h-12 object-cover rounded-lg border border-zinc-100 dark:border-zinc-800 shrink-0"
                        />
                      )}
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                        {lastAddedItem.name}
                      </p>
                    </div>
                  )}
                  <Link
                    to="/cart"
                    onClick={() => {
                      setShowCartPopup(false);
                      setIsCartBouncing(false);
                    }}
                    className="block w-full text-center py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-800 transition"
                  >
                    {isArabic ? 'عرض السلة وإتمام الطلب' : 'View Cart & Checkout'}
                  </Link>
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-bold border border-zinc-300 dark:border-zinc-700 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ml-1 rtl:ml-0 rtl:mr-1"
            >
              {isArabic ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="py-3 border-t border-zinc-100 dark:border-zinc-800/60"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isArabic
                    ? 'ابحث عن هوديز، تيشيرتات، جاكيتات...'
                    : 'Search hoodies, tees, jackets...'
                }
                autoFocus
                className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-6 space-y-4 text-start">
          <nav className="flex flex-col space-y-3 font-semibold text-sm">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-black dark:hover:text-white"
            >
              {isArabic ? 'الرئيسية' : 'Home'}
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-black dark:hover:text-white"
            >
              {isArabic ? 'المنتجات' : 'Products'}
            </Link>

            <Link
              to="/new-arrivals"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 flex items-center gap-1.5 text-amber-600 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isArabic ? 'جديدنا' : 'New In'}</span>
            </Link>

            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-black dark:hover:text-white"
            >
              {isArabic ? `عن ${storeName}` : `About ${storeName}`}
            </Link>

            {/* Quick Install App Button */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerAppInstallPrompt();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-zinc-900 dark:text-zinc-100 font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>{isArabic ? 'تثبيت التطبيق على هاتفك' : 'Install Mobile App'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold">
                  {isArabic ? 'اختصار سريع' : 'Shortcut'}
                </span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
