import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsTracker } from '../utils/analyticsTracker.js';
import { useCart } from '../store/cartStore.js';

export function useAnalyticsTracker() {
  const location = useLocation();
  const { items, subtotal } = useCart();
  const abandonedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track page view on route change (deferred to avoid blocking critical initial renders)
  useEffect(() => {
    const timer = setTimeout(() => {
      analyticsTracker.trackPageView(location.pathname + location.search);
    }, 1200);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Track abandoned cart after 45 seconds of having items in cart without checkout
  useEffect(() => {
    if (abandonedTimerRef.current) {
      clearTimeout(abandonedTimerRef.current);
    }

    if (items.length > 0 && location.pathname !== '/order/success') {
      abandonedTimerRef.current = setTimeout(() => {
        analyticsTracker.trackAbandonedCart(items, subtotal);
      }, 45000); // 45s threshold
    }

    return () => {
      if (abandonedTimerRef.current) {
        clearTimeout(abandonedTimerRef.current);
      }
    };
  }, [items, subtotal, location.pathname]);
}
