import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsTracker } from '../utils/analyticsTracker.js';
import { useCart } from '../store/cartStore.js';

export function useAnalyticsTracker() {
  const location = useLocation();
  const { items, subtotal } = useCart();
  const abandonedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track page view immediately on route change
  useEffect(() => {
    analyticsTracker.trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Track abandoned cart after 30 seconds of having items in cart without checkout
  useEffect(() => {
    if (abandonedTimerRef.current) {
      clearTimeout(abandonedTimerRef.current);
    }

    if (items.length > 0 && !location.pathname.startsWith('/order/success') && !location.pathname.startsWith('/darsh50')) {
      abandonedTimerRef.current = setTimeout(() => {
        analyticsTracker.trackAbandonedCart(items, subtotal);
      }, 30000); // 30s threshold
    }

    return () => {
      if (abandonedTimerRef.current) {
        clearTimeout(abandonedTimerRef.current);
      }
    };
  }, [items, subtotal, location.pathname]);
}
