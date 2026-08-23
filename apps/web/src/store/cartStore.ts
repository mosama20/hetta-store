import { useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Color, Size } from '../types/index.js';
import { discountsApi } from '../api/index.js';

const CART_STORAGE_KEY = 'fs_shopping_cart';
const COUPON_STORAGE_KEY = 'fs_applied_coupon';

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(CART_STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function getStoredCoupon(): { code: string; percent: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(COUPON_STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Local storage error handling
  }
}

function saveCoupon(coupon: { code: string; percent: number } | null) {
  if (typeof window === 'undefined') return;
  try {
    if (coupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  } catch {
    // Local storage error handling
  }
}

let listeners: (() => void)[] = [];
let cartItems: CartItem[] = getStoredCart();
let appliedCouponData: { code: string; percent: number } | null = getStoredCoupon();

function notify() {
  saveCart(cartItems);
  saveCoupon(appliedCouponData);
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const [, setTrigger] = useState(0);

  useEffect(() => {
    const listener = () => setTrigger((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.variant.price) * item.quantity,
    0,
  );

  const discountPercent = appliedCouponData ? appliedCouponData.percent : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    items: cartItems,
    totalItems,
    subtotal,
    appliedCoupon: appliedCouponData ? appliedCouponData.code : null,
    discountPercent,
    discountAmount,
    finalTotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  };
}

export async function applyCoupon(code: string): Promise<{ success: boolean; message: string; discountPercent?: number }> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, message: 'يرجى إدخال كود الخصم' };
  }

  // Pre-configured well-known coupons or query discounts API
  if (trimmed === 'SUMMER15' || trimmed === 'CRAFT15') {
    appliedCouponData = { code: trimmed, percent: 15 };
    notify();
    return { success: true, message: 'تم تطبيق خصم 15% بنجاح!', discountPercent: 15 };
  }

  if (trimmed === 'WELCOME10' || trimmed === 'CRAFT10') {
    appliedCouponData = { code: trimmed, percent: 10 };
    notify();
    return { success: true, message: 'تم تطبيق خصم 10% بنجاح!', discountPercent: 10 };
  }

  if (trimmed === 'VIP20') {
    appliedCouponData = { code: trimmed, percent: 20 };
    notify();
    return { success: true, message: 'تم تطبيق خصم VIP 20% بنجاح!', discountPercent: 20 };
  }

  try {
    const discounts = await discountsApi.getAll();
    const match = discounts.find(
      (d) => d.nameEn.toUpperCase().includes(trimmed) || d.nameAr.includes(trimmed) || (d as any).code === trimmed,
    );

    if (match && match.isActive) {
      const pct = Number(match.value) || 10;
      appliedCouponData = { code: trimmed, percent: pct };
      notify();
      return { success: true, message: `تم تطبيق خصم ${pct}% بنجاح!`, discountPercent: pct };
    }
  } catch {
    // API fallback failed
  }

  return { success: false, message: 'كود الخصم غير صالح أو منتهي الصلاحية' };
}

export function removeCoupon() {
  appliedCouponData = null;
  notify();
}

export const CART_ITEM_ADDED_EVENT = 'craft_cart_item_added';

export function addItem(
  product: Product,
  variant: ProductVariant,
  selectedColor: Color,
  selectedSize: Size,
  quantity = 1,
) {
  const existingIndex = cartItems.findIndex((item) => item.variantId === variant.id);

  if (existingIndex > -1) {
    const newQty = cartItems[existingIndex].quantity + quantity;
    const maxQty = variant.stockQuantity;
    cartItems[existingIndex].quantity = Math.min(newQty, maxQty);
  } else {
    cartItems.push({
      variantId: variant.id,
      product,
      variant,
      selectedColor,
      selectedSize,
      quantity: Math.min(quantity, variant.stockQuantity),
    });
  }
  notify();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CART_ITEM_ADDED_EVENT, {
        detail: { product, variant, quantity },
      }),
    );
  }
}

export function removeItem(variantId: string) {
  cartItems = cartItems.filter((item) => item.variantId !== variantId);
  notify();
}

export function updateQuantity(variantId: string, quantity: number) {
  const existing = cartItems.find((item) => item.variantId === variantId);
  if (!existing) return;

  if (quantity <= 0) {
    removeItem(variantId);
  } else {
    existing.quantity = Math.min(quantity, existing.variant.stockQuantity);
    notify();
  }
}

export function clearCart() {
  cartItems = [];
  appliedCouponData = null;
  notify();
}
