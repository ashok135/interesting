'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/store/CartContext';
import { useAuth } from '@/store/AuthContext';
import { createOrder } from '@/lib/api/orders';
import { formatPrice } from '@/lib/utils/formatters';
import {
  CheckCircle2,
  Banknote,
  CreditCard,
  MapPin,
  Tag,
  ChevronDown,
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Truck,
  ShieldCheck,
  Clock,
  Edit2,
  X,
  Plus,
  LogIn,
  UserPlus,
  Package,
  Sparkles,
  TriangleAlert,
  LocateFixed,
  Navigation,
  Copy,
  ExternalLink,
  Home,
  Briefcase,
  Check,
  FileText,
} from 'lucide-react';
import type { OrderBilling, OrderPayload } from '@/types';
import { GoogleLoader } from '@/components/ui';
import styles from './page.module.css';

type CheckoutStep = 'auth' | 'address' | 'payment' | 'success';
type AuthMode = 'login' | 'signup';
type PaymentMethod = 'razorpay' | 'cod' | 'upi';

interface WooCommerceCoupon {
  id: number;
  code: string;
  amount: number;
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
  description: string;
  minimum_amount: number;
  maximum_amount: number;
  product_ids?: number[];
  excluded_product_ids?: number[];
  free_shipping?: boolean;
  date_expires?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  exclude_sale_items?: boolean;
  limit_usage_to_x_items?: number | null;
}

interface ConfirmedOrder {
  id: number;
  total: number;
  itemCount: number;
  paymentTitle: string;
}

export interface SavedAddress {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY_ADDR: OrderBilling = {
  first_name: '', last_name: '', email: '', phone: '',
  address_1: '', address_2: '', city: '', state: '', postcode: '', country: 'IN',
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function RazorpayIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Razorpay"
    >
      <rect width="32" height="32" rx="7" fill="#0C2340" />
      <path
        d="M22.8 5.2L13.2 11.4L12.3 14.8L17.6 11.3L13.7 24.2L22.8 11.7H18.4L22.8 5.2Z"
        fill="#0284C7"
      />
      <path
        d="M11.5 17L9.9 22.4L16.9 12.7H13.5L16.6 8L9.8 12.4L9.1 15L13 12.5L11.5 17Z"
        fill="#38BDF8"
      />
    </svg>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartContext();
  const { user, customer, loading: authLoading, loginWithEmail, signupWithEmail, loginWithGoogle, refresh } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved');
  const [addrForm, setAddrForm] = useState<OrderBilling>(EMPTY_ADDR);

  const [availableCoupons, setAvailableCoupons] = useState<WooCommerceCoupon[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<WooCommerceCoupon | null>(null);

  const [payMethod, setPayMethod] = useState<PaymentMethod>('razorpay');
  const [upiRef, setUpiRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderFlowState, setOrderFlowState] = useState<'idle' | 'animating' | 'confirmed'>('idle');
  const [orderError, setOrderError] = useState('');
  const [addrError, setAddrError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [addrTag, setAddrTag] = useState<'Home' | 'Work' | 'Other'>('Home');

  /* ── Preload Razorpay Checkout Script ── */
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  /* ── Load WooCommerce live coupons ── */
  useEffect(() => {
    fetch('/api/coupons')
      .then((r) => r.json())
      .then((data) => {
        if (data.coupons && Array.isArray(data.coupons)) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch((err) => console.warn('Failed to load coupons from WooCommerce:', err));
  }, []);

  /* ── GPS Location state ── */
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [locSuccess, setLocSuccess] = useState(false);

  /* ── Auto-advance step on auth change & load saved addresses ── */
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setStep('payment');

      // 1. Load addresses from localStorage
      const storageKey = `intersting_saved_addresses_${user.id}`;
      let loaded: SavedAddress[] = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) loaded = JSON.parse(stored);
      } catch {
        loaded = [];
      }

      // 2. If no saved addresses exist yet in localStorage, populate from customer shipping/billing
      if (loaded.length === 0 && (customer?.shipping?.address_1 || customer?.billing?.address_1)) {
        const s = customer?.shipping;
        const b = customer?.billing;
        const primaryAddr: SavedAddress = {
          id: 'wc-default',
          tag: 'Home',
          firstName: s?.first_name || b?.first_name || user.name?.split(' ')[0] || '',
          lastName: s?.last_name || b?.last_name || user.name?.split(' ').slice(1).join(' ') || '',
          address1: s?.address_1 || b?.address_1 || '',
          address2: s?.address_2 || b?.address_2 || '',
          city: s?.city || b?.city || '',
          state: s?.state || b?.state || '',
          postcode: s?.postcode || b?.postcode || '',
          country: s?.country || 'IN',
          phone: b?.phone || '',
          isDefault: true,
        };
        loaded = [primaryAddr];
        try {
          localStorage.setItem(storageKey, JSON.stringify(loaded));
        } catch {}
      }

      setSavedAddresses(loaded);
      const def = loaded.find((a) => a.isDefault) || loaded[0];
      if (def) {
        setSelectedAddressId(def.id);
      }

      const hasAddr = loaded.length > 0 || !!(customer?.shipping?.address_1 || customer?.billing?.address_1);
      if (customer) {
        const s = customer.shipping;
        const b = customer.billing;
        setAddrForm({
          first_name: s?.first_name || b?.first_name || user.name?.split(' ')[0] || '',
          last_name:  s?.last_name  || b?.last_name  || user.name?.split(' ').slice(1).join(' ') || '',
          email:      b?.email      || user.email     || '',
          phone:      b?.phone      || '',
          address_1:  s?.address_1  || b?.address_1   || '',
          address_2:  s?.address_2  || b?.address_2   || '',
          city:       s?.city       || b?.city         || '',
          state:      s?.state      || b?.state        || '',
          postcode:   s?.postcode   || b?.postcode     || '',
          country: 'IN',
        });
      }
      setIsChangingAddress(!hasAddr);
    } else if (!isGuest) {
      setStep('auth');
    }
  }, [user, customer, authLoading, isGuest]);

  /* ── Redirect empty cart ── */
  useEffect(() => {
    if (!authLoading && items.length === 0 && !confirmedOrder && orderId === null && step !== 'success') {
      router.replace('/cart');
    }
  }, [items.length, orderId, confirmedOrder, step, authLoading, router]);

  /* ── Auto-scroll to top and focus celebration card when order is placed ── */
  useEffect(() => {
    if (step === 'success' || confirmedOrder) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const el = document.getElementById('order-success-card');
        if (el) {
          el.focus({ preventScroll: true });
        }
      }, 60);
      return () => clearTimeout(t);
    }
  }, [step, confirmedOrder]);

  /* ── Pricing & WooCommerce Multi-Rule Coupon Calculation ── */
  const subtotal = parseFloat(total) || 0;
  const isFreeShippingByCoupon = Boolean(appliedCoupon?.free_shipping);
  const delivery = (subtotal >= 499 || isFreeShippingByCoupon) ? 0 : 49;

  let discount = 0;
  if (appliedCoupon) {
    const hasProductFilter = Array.isArray(appliedCoupon.product_ids) && appliedCoupon.product_ids.length > 0;
    const hasExcludedFilter = Array.isArray(appliedCoupon.excluded_product_ids) && appliedCoupon.excluded_product_ids.length > 0;

    const isItemEligible = (item: { productId: number; price: string; quantity: number }) => {
      if (hasProductFilter && !appliedCoupon.product_ids!.includes(item.productId)) {
        return false;
      }
      if (hasExcludedFilter && appliedCoupon.excluded_product_ids!.includes(item.productId)) {
        return false;
      }
      return true;
    };

    if (appliedCoupon.discount_type === 'percent') {
      const eligibleSubtotal = items
        .filter(isItemEligible)
        .reduce((sum, it) => sum + (parseFloat(it.price) || 0) * it.quantity, 0);
      discount = Math.round((eligibleSubtotal * appliedCoupon.amount) / 100);
    } else if (appliedCoupon.discount_type === 'fixed_product') {
      // Fixed product discount: applied per eligible item quantity in cart (with optional max items limit)
      const maxItems = appliedCoupon.limit_usage_to_x_items && appliedCoupon.limit_usage_to_x_items > 0
        ? appliedCoupon.limit_usage_to_x_items
        : Infinity;

      let itemsDiscounted = 0;
      discount = items
        .filter(isItemEligible)
        .reduce((sum, it) => {
          if (itemsDiscounted >= maxItems) return sum;
          const qtyToDiscount = Math.min(it.quantity, maxItems - itemsDiscounted);
          itemsDiscounted += qtyToDiscount;
          const itemPrice = parseFloat(it.price) || 0;
          const unitDiscount = Math.min(itemPrice, appliedCoupon.amount);
          return sum + unitDiscount * qtyToDiscount;
        }, 0);
    } else {
      // Fixed cart discount
      discount = Math.min(subtotal, appliedCoupon.amount);
    }
  }

  const grandTotal = Math.max(0, subtotal + delivery - discount);

  /* ── Auto-revalidate applied coupon on cart updates ── */
  useEffect(() => {
    if (!appliedCoupon) return;
    if (appliedCoupon.minimum_amount > 0 && subtotal < appliedCoupon.minimum_amount) {
      setCouponError(`Coupon "${appliedCoupon.code}" removed: Minimum order value of ₹${appliedCoupon.minimum_amount} required.`);
      setAppliedCoupon(null);
    } else if (appliedCoupon.maximum_amount > 0 && subtotal > appliedCoupon.maximum_amount) {
      setCouponError(`Coupon "${appliedCoupon.code}" removed: Maximum order value of ₹${appliedCoupon.maximum_amount} exceeded.`);
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  /* ── Saved address ── */
  const hasSaved = savedAddresses.length > 0 || !!(customer?.shipping?.address_1 || customer?.billing?.address_1);

  function getAddr(): OrderBilling {
    if (!isAddingNew && selectedAddressId) {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (found) {
        return {
          first_name: found.firstName || user?.name?.split(' ')[0] || '',
          last_name:  found.lastName  || user?.name?.split(' ').slice(1).join(' ') || '',
          email:      user?.email     || addrForm.email || '',
          phone:      found.phone     || addrForm.phone || '',
          address_1:  found.address1  || '',
          address_2:  found.address2  || '',
          city:       found.city      || '',
          state:      found.state     || '',
          postcode:   found.postcode  || '',
          country:    found.country   || 'IN',
        };
      }
    }
    if (hasSaved && addressMode === 'saved' && customer) {
      const s = customer.shipping;
      const b = customer.billing;
      return {
        first_name: s?.first_name || b?.first_name || user?.name?.split(' ')[0] || '',
        last_name:  s?.last_name  || b?.last_name  || user?.name?.split(' ').slice(1).join(' ') || '',
        email:      b?.email      || user?.email    || '',
        phone:      b?.phone      || '',
        address_1:  s?.address_1  || b?.address_1   || '',
        address_2:  s?.address_2  || b?.address_2   || '',
        city:       s?.city       || b?.city         || '',
        state:      s?.state      || b?.state        || '',
        postcode:   s?.postcode   || b?.postcode     || '',
        country: 'IN',
      };
    }
    return addrForm;
  }

  /* ── Auth submit ── */
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const res = authMode === 'login'
        ? await loginWithEmail(authEmail, authPassword)
        : await signupWithEmail(authName, authEmail, authPassword);
      if (!res.success) setAuthError(res.error || 'Something went wrong');
    } finally {
      setAuthBusy(false);
    }
  }

  /* ── Google sign-in ── */
  async function handleGoogleAuth() {
    setAuthError('');
    setGoogleBusy(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) setAuthError(res.error || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleBusy(false);
    }
  }

  /* ── Coupon — Validated live with WooCommerce ── */
  async function applyCoupon(codeToApply?: string) {
    setCouponError('');
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.valid || !data.coupon) {
        setCouponError(data.error || `Coupon "${code}" is not valid.`);
        return;
      }
      const c: WooCommerceCoupon = data.coupon;

      // 1. Expiration check
      if (c.date_expires && new Date(c.date_expires).getTime() < Date.now()) {
        setCouponError(`Coupon "${code}" has expired.`);
        return;
      }

      // 2. Usage limit check
      if (c.usage_limit && c.usage_limit > 0 && (c.usage_count || 0) >= c.usage_limit) {
        setCouponError(`Coupon "${code}" usage limit has been reached.`);
        return;
      }

      // 3. Minimum spend check
      if (c.minimum_amount > 0 && subtotal < c.minimum_amount) {
        setCouponError(`Minimum order value of ₹${c.minimum_amount} required for this coupon.`);
        return;
      }

      // 4. Maximum spend check
      if (c.maximum_amount > 0 && subtotal > c.maximum_amount) {
        setCouponError(`Maximum order value for this coupon is ₹${c.maximum_amount}.`);
        return;
      }

      // 5. Product inclusion restrictions
      if (Array.isArray(c.product_ids) && c.product_ids.length > 0) {
        const hasMatchingProduct = items.some((it) => c.product_ids!.includes(it.productId));
        if (!hasMatchingProduct) {
          setCouponError('This coupon is only valid for specific products that are not in your cart.');
          return;
        }
      }

      // 6. Product exclusion restrictions
      if (Array.isArray(c.excluded_product_ids) && c.excluded_product_ids.length > 0) {
        const allExcluded = items.every((it) => c.excluded_product_ids!.includes(it.productId));
        if (allExcluded) {
          setCouponError('This coupon cannot be applied to the products in your cart.');
          return;
        }
      }

      setAppliedCoupon(c);
      setCouponOpen(false);
      setCouponInput('');
    } catch {
      setCouponError('Could not verify coupon. Please try again.');
    } finally {
      setApplyingCoupon(false);
    }
  }

  /* ── GPS Location — Nominatim reverse geocode (free, no API key) ── */
  async function useCurrentLocation() {
    setLocError('');
    setLocSuccess(false);

    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('Geocoding failed');
          const data = await res.json();
          const a = data.address || {};

          /* Map Nominatim fields → our form */
          const road       = a.road || a.pedestrian || a.footway || a.neighbourhood || '';
          const suburb     = a.suburb || a.neighbourhood || a.quarter || '';
          const city       = a.city || a.town || a.village || a.county || '';
          const state      = a.state || '';
          const postcode   = (a.postcode || '').replace(/\s/g, '').slice(0, 6);
          const addr1      = [a.house_number, road].filter(Boolean).join(' ');
          const addr2      = suburb;

          setAddrForm((prev) => ({
            ...prev,
            address_1: addr1 || road || suburb,
            address_2: addr2,
            city,
            state,
            postcode,
          }));
          setLocSuccess(true);
          /* Clear success msg after 3 s */
          setTimeout(() => setLocSuccess(false), 3000);
        } catch {
          setLocError('Could not fetch address. Please enter manually.');
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError(
            'Location permission is blocked by your browser. Click the lock/settings icon (🔒) next to the website URL to allow location, or fill your address below.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocError('Device location is turned off or unavailable. Please enter address manually.');
        } else if (err.code === err.TIMEOUT) {
          setLocError('Location detection timed out. Please try again or enter address manually.');
        } else {
          setLocError('Unable to detect location. Please enter address manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  /* ── Place order ── */
  async function placeOrder() {
    setOrderError('');
    setPlacing(true);
    const addr = getAddr();
    if (!addr.address_1?.trim() || !addr.city?.trim() || !addr.postcode?.trim()) {
      setOrderError('Please add a complete delivery address.');
      setIsChangingAddress(true);
      setPlacing(false);
      return;
    }
    const cleanPhone = (addr.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setOrderError('Please enter a valid 10-digit mobile number for order delivery & SMS updates.');
      setIsChangingAddress(true);
      setPlacing(false);
      return;
    }
    if (!addr.email?.trim() || !addr.email.includes('@')) {
      setOrderError('Please enter a valid email address for order confirmation.');
      setIsChangingAddress(true);
      setPlacing(false);
      return;
    }

    const finalBilling: OrderBilling = {
      ...addr,
      first_name: addr.first_name || user?.name?.split(' ')[0] || 'Customer',
      last_name: addr.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
      email: addr.email || user?.email || '',
      phone: addr.phone || '',
    };

    const storeUpiId = process.env.NEXT_PUBLIC_STORE_UPI_ID || '9994847167@upi';
    const orderItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const orderGrandTotal = grandTotal;
    const orderPaymentTitle = payMethod === 'razorpay'
      ? 'Online Payment (UPI / Cards / Netbanking via Razorpay)'
      : payMethod === 'cod'
      ? 'Cash on Delivery'
      : 'Direct UPI Transfer';

    // ── Show truck animation overlay IMMEDIATELY (replaces all loading states) ──
    setOrderFlowState('animating');
    const MIN_ANIM_MS = 1500;
    const animStart = Date.now();

    /* ── Razorpay Online Payment Flow ── */
    if (payMethod === 'razorpay') {
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        // 1. Prepare order payload
        const currentOrderPayload: OrderPayload = {
          customer_id: user?.id,
          billing: finalBilling,
          shipping: finalBilling,
          line_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
          coupon_code: appliedCoupon?.code,
          shipping_lines: [
            {
              method_id: delivery === 0 ? 'free_shipping' : 'flat_rate',
              method_title: delivery === 0 ? 'Free Express Delivery' : 'Standard Delivery',
              total: String(delivery),
            },
          ],
        };

        // 2. Create order on Next.js backend & register pending checkout
        const createRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: orderGrandTotal,
            orderData: currentOrderPayload,
            notes: {
              customer_name: `${finalBilling.first_name} ${finalBilling.last_name}`.trim(),
              customer_phone: finalBilling.phone,
              items_count: String(orderItemCount),
            },
          }),
        });

        const rzpOrder = await createRes.json();
        if (!createRes.ok || !rzpOrder.success) {
          throw new Error(rzpOrder.error || 'Failed to initialize payment gateway order.');
        }

        // 3. Open Razorpay Checkout Modal (truck overlay stays visible underneath)
        const options = {
          key: rzpOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U1ADQmS0qOpccj',
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'Interesting Gourmet Pantry',
          description: `Express Order (${orderItemCount} items)`,
          image: '/images/squirrel-logo.png',
          order_id: rzpOrder.orderId,
          prefill: {
            name: `${finalBilling.first_name} ${finalBilling.last_name}`.trim(),
            email: finalBilling.email || 'guest@interestingstore.com',
            contact: finalBilling.phone,
          },
          notes: {
            delivery_city: finalBilling.city,
            pincode: finalBilling.postcode,
          },
          theme: {
            color: '#0d3821',
          },
          handler: async function (response: any) {
            // Truck overlay already visible — just verify payment
            try {
              const verifyJson = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData: currentOrderPayload,
                }),
              }).then((r) => r.json());

              if (!verifyJson.success) {
                throw new Error(verifyJson.error || 'Payment verification failed. Please contact support.');
              }

              // Ensure animation shows minimum time
              const elapsed = Date.now() - animStart;
              if (elapsed < MIN_ANIM_MS) {
                await new Promise((res) => setTimeout(res, MIN_ANIM_MS - elapsed));
              }

              setConfirmedOrder({
                id: verifyJson.order.id,
                total: orderGrandTotal,
                itemCount: orderItemCount,
                paymentTitle: `Online Paid (Razorpay: ${response.razorpay_payment_id})`,
              });
              setOrderId(verifyJson.order.id);
              setOrderFlowState('confirmed');
              setStep('success');
              clearCart();
              refresh?.();
            } catch (vErr: any) {
              setOrderFlowState('idle');
              setOrderError(vErr.message || 'Payment confirmation error.');
            } finally {
              setPlacing(false);
            }
          },
          modal: {
            ondismiss: function () {
              // User closed Razorpay without paying — reset
              setPlacing(false);
              setOrderFlowState('idle');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          console.error('[Razorpay] Payment failed:', resp.error);
          setOrderError(resp.error?.description || 'Payment was declined or cancelled. Please try again.');
          setPlacing(false);
          setOrderFlowState('idle');
        });
        rzp.open();
        return;
      } catch (err: any) {
        setOrderError(err.message || 'Failed to open Razorpay payment window.');
        setPlacing(false);
        setOrderFlowState('idle');
        return;
      }
    }

    if (payMethod === 'upi') {
      const cleanRef = upiRef.trim();
      if (!cleanRef) {
        setOrderError('Please enter your 12-digit UPI Reference / UTR Number to confirm your payment.');
        setPlacing(false);
        setOrderFlowState('idle');
        return;
      }
      if (cleanRef.length < 6) {
        setOrderError('Please enter a valid UPI Reference / UTR Number from your payment app.');
        setPlacing(false);
        setOrderFlowState('idle');
        return;
      }
    }

    // COD & Direct UPI: overlay already showing, place the order
    try {
      const order = await createOrder({
        customer_id: user?.id,
        payment_method: payMethod === 'cod' ? 'cod' : 'bacs',
        payment_method_title: orderPaymentTitle,
        set_paid: false,
        billing: finalBilling,
        shipping: finalBilling,
        line_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        coupon_code: appliedCoupon?.code,
        customer_note: payMethod === 'upi' ? `Paid via UPI to ${storeUpiId}. UTR / Ref No: ${upiRef.trim()}` : undefined,
        shipping_lines: [
          {
            method_id: delivery === 0 ? 'free_shipping' : 'flat_rate',
            method_title: delivery === 0 ? 'Free Express Delivery' : 'Standard Delivery',
            total: String(delivery),
          },
        ],
      });

      // Ensure animation shows minimum time
      const elapsed = Date.now() - animStart;
      if (elapsed < MIN_ANIM_MS) {
        await new Promise((res) => setTimeout(res, MIN_ANIM_MS - elapsed));
      }

      setConfirmedOrder({
        id: order.id,
        total: orderGrandTotal,
        itemCount: orderItemCount,
        paymentTitle: orderPaymentTitle,
      });
      setOrderId(order.id);
      setOrderFlowState('confirmed');
      setStep('success');

      clearCart();
      refresh?.();
    } catch (err) {
      setOrderFlowState('idle');
      setOrderError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  /* ── Loading (only initial load, never during order animation or confirmation) ── */
  if (authLoading && !user && !isGuest && orderFlowState === 'idle' && !confirmedOrder) {
    return (
      <div className={styles.loadingState}>
        <GoogleLoader size={46} text="Loading checkout…" />
      </div>
    );
  }

  /* ── Success screen fallback (direct load or refresh) ── */
  if ((step === 'success' || confirmedOrder) && orderFlowState === 'idle') {
    const oId = confirmedOrder?.id || orderId;
    const oTotal = confirmedOrder?.total ?? grandTotal;
    const oItems = confirmedOrder?.itemCount ?? (items.length || 1);
    const oPay = confirmedOrder?.paymentTitle ?? (payMethod === 'cod' ? 'Cash on Delivery' : 'Direct UPI Transfer');

    return (
      <div className={styles.successPage}>
        <div
          id="order-success-card"
          tabIndex={-1}
          style={{ outline: 'none' }}
          className={styles.successCard}
        >
          <div className={styles.successCircle}>
            <CheckCircle2 size={40} strokeWidth={2} />
          </div>
          <h1 className={styles.successTitle}>Order Placed! 🎉</h1>
          <p className={styles.successOrderNum}>Order #{oId}</p>
          <p className={styles.successMsg}>
            Your farm-fresh gourmet items are confirmed and being packed with care.
            Expected delivery in <strong>3–5 business days</strong>.
          </p>
          <div className={styles.successSummaryBox}>
            <div className={styles.successSummaryRow}>
              <span>Items</span>
              <span>{oItems} {oItems === 1 ? 'item' : 'items'}</span>
            </div>
            <div className={styles.successSummaryRow}>
              <span>Amount</span>
              <span className={styles.successAmount}>{formatPrice(oTotal)}</span>
            </div>
            <div className={styles.successSummaryRow}>
              <span>Payment</span>
              <span>{oPay}</span>
            </div>
            <div className={styles.successSummaryRow}>
              <span>Order Status</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Confirmed &amp; Processing</span>
            </div>
          </div>
          {isGuest && (
            <p style={{ fontSize: '0.82rem', color: '#475569', textAlign: 'center', margin: '0.75rem 0 1rem', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              📱 Order updates and real-time dispatch tracking will be sent directly via SMS to your mobile.
            </p>
          )}
          <div className={styles.successActions}>
            {oId && (
              <a
                href={`/api/invoice/${oId}/download`}
                download={`Invoice-INTERSTING-${oId}.pdf`}
                className={styles.successInvoiceBtn}
                title="Download official tax invoice (PDF)"
              >
                <FileText size={16} /> Download Tax Invoice (PDF)
              </a>
            )}
            <div className={styles.successSubActions}>
              <Link href={user ? "/account" : "/shop"} className={styles.successTrackBtn}>
                <Package size={16} /> {user ? "Track Order" : "View More Products"}
              </Link>
              <Link href="/shop" className={styles.successShopBtn}>
                Continue Shopping <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !confirmedOrder) return null;

  const addrDisplay = getAddr();
  const activeSaved = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
  const hasSelectedValidAddr = !!(
    addrDisplay.first_name?.trim() &&
    addrDisplay.phone?.trim() &&
    addrDisplay.address_1?.trim() &&
    addrDisplay.city?.trim() &&
    addrDisplay.postcode?.trim()
  );

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── Progress stepper (3 steps: Account ── Address ── Payment) ── */}
        <div className={styles.stepper}>
          {(['auth', 'address', 'payment'] as const).map((s, i) => {
            const labels = [isGuest && !user ? 'Guest' : 'Account', 'Address', 'Payment'];
            const stepOrder = { auth: 0, address: 1, payment: 2, success: 3 };
            const current = stepOrder[step];
            const me = stepOrder[s];
            const isActive = step === s;
            const isDone = current > me || (step === 'payment' && (s === 'auth' || s === 'address'));
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (s === 'auth' && (user || isGuest)) {
                      setIsGuest(false);
                      setStep('auth');
                    } else if (s === 'address' && step === 'payment') {
                      setIsChangingAddress(true);
                      setIsAddingNew(false);
                    }
                  }}
                  disabled={!isDone && !isActive}
                  className={`${styles.stepPill} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''} ${isDone ? styles.stepClickable : ''}`}
                  title={isDone ? `Change ${labels[i]}` : undefined}
                >
                  {isDone ? <CheckCircle2 size={14} /> : <span className={styles.stepNum}>{i + 1}</span>}
                  <span>{labels[i]}</span>
                </button>
                {i < 2 && <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`} />}
              </div>
            );
          })}
        </div>

        <div className={styles.layout}>

          {/* ── LEFT: Steps ── */}
          <div className={styles.mainCol}>

            {/* STEP 1 — Auth */}
            {step === 'auth' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}><User size={18} /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Sign in to continue</h2>
                    <p className={styles.cardSubtitle}>Faster checkout, order tracking & exclusive offers</p>
                  </div>
                </div>

                <div className={styles.authToggle}>
                  <button
                    type="button"
                    className={`${styles.authToggleBtn} ${authMode === 'login' ? styles.authToggleActive : ''}`}
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  >
                    <LogIn size={14} /> Login
                  </button>
                  <button
                    type="button"
                    className={`${styles.authToggleBtn} ${authMode === 'signup' ? styles.authToggleActive : ''}`}
                    onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  >
                    <UserPlus size={14} /> Create Account
                  </button>
                </div>

                <form className={styles.authForm} onSubmit={handleAuth}>
                  {authMode === 'signup' && (
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Full Name</label>
                      <div className={styles.inputWrap}>
                        <User size={15} className={styles.inputIcon} />
                        <input type="text" placeholder="Your full name" value={authName}
                          onChange={(e) => setAuthName(e.target.value)} required className={styles.input} />
                      </div>
                    </div>
                  )}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Email address</label>
                    <div className={styles.inputWrap}>
                      <Mail size={15} className={styles.inputIcon} />
                      <input type="email" placeholder="you@email.com" value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)} required className={styles.input} />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Password</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} className={styles.inputIcon} />
                      <input type={showPass ? 'text' : 'password'}
                        placeholder={authMode === 'signup' ? 'Create a password (min 8 chars)' : 'Enter password'}
                        value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                        required minLength={authMode === 'signup' ? 8 : undefined} className={styles.input} />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <div className={styles.errorBox}>
                      <TriangleAlert size={14} /> {authError}
                    </div>
                  )}

                  <button type="submit" className={styles.primaryBtn} disabled={authBusy || googleBusy}>
                    {authBusy
                      ? <span className={styles.btnSpinner} />
                      : authMode === 'login'
                        ? <><LogIn size={16} /> Login & Continue</>
                        : <><UserPlus size={16} /> Create Account & Continue</>
                    }
                  </button>
                </form>

                {/* ── Google Sign-In Divider ── */}
                <div className={styles.divider} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.1rem 0 0.9rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>or sign in faster with</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={googleBusy || authBusy}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    background: googleBusy ? '#f8fafc' : '#fff',
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    cursor: googleBusy ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    marginBottom: '0.5rem',
                  }}
                  onMouseEnter={(e) => { if (!googleBusy) (e.currentTarget as HTMLButtonElement).style.borderColor = '#4285F4'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; }}
                >
                  {googleBusy ? (
                    <>
                      <span className={styles.btnSpinner} style={{ borderTopColor: '#4285F4' }} />
                      Connecting to Google…
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* ── Guest Checkout Action ── */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuest(true);
                      setIsChangingAddress(true);
                      setStep('payment');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #0d3821',
                      background: '#f0fdf4',
                      color: '#0d3821',
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#dcfce7'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4'; }}
                  >
                    <span>⚡ Continue as Guest (No Password Needed)</span>
                    <ArrowRight size={16} />
                  </button>
                  <p style={{ margin: '0.55rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Quick express checkout. You will still receive full SMS order tracking updates.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2 — Unified Delivery & Payment */}
            {step === 'payment' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}><ShieldCheck size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <h2 className={styles.cardTitle}>Delivery &amp; Payment</h2>
                    <p className={styles.cardSubtitle}>Confirm your delivery address and choose payment method</p>
                  </div>
                  {isGuest && !user && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuest(false);
                        setStep('auth');
                      }}
                      className={styles.guestSwitchBtn}
                      title="Sign in with your account"
                    >
                      Sign In
                    </button>
                  )}
                </div>

                {/* ── 1. DELIVERY ADDRESS SECTION (Seamless Flipkart / Blinkit flow) ── */}
                <div className={styles.deliveryBlock}>
                  <div className={styles.blockHeadingRow}>
                    <div className={styles.blockHeadingLeft}>
                      <MapPin size={16} className={styles.blockIcon} />
                      <h3 className={styles.blockHeading}>Delivery Address</h3>
                    </div>
                    {!isChangingAddress && hasSelectedValidAddr && (
                      <button
                        type="button"
                        className={styles.changeAddressBtn}
                        onClick={() => {
                          setIsChangingAddress(true);
                          setAddrError('');
                        }}
                      >
                        <Edit2 size={13} /> Change
                      </button>
                    )}
                  </div>

                  {/* Clean default selected address card */}
                  {!isChangingAddress && hasSelectedValidAddr ? (
                    <div className={styles.deliverToCard}>
                      <div className={styles.deliverToTop}>
                        <div className={styles.deliverToBadgeWrap}>
                          <span className={styles.deliverToTag}>
                            {activeSaved?.tag === 'Work' ? <Briefcase size={11} /> : <MapPin size={11} />}
                            Deliver to ({activeSaved?.tag || 'Home'})
                          </span>
                          <span className={styles.deliverToName}>
                            {[addrDisplay.first_name, addrDisplay.last_name].filter(Boolean).join(' ') || 'Customer'}
                          </span>
                          {addrDisplay.phone && (
                            <span className={styles.deliverToPhone}>• {addrDisplay.phone}</span>
                          )}
                        </div>
                      </div>
                      <p className={styles.deliverToAddressText}>
                        {addrDisplay.address_1}
                        {addrDisplay.address_2 ? `, ${addrDisplay.address_2}` : ''}, {addrDisplay.city}, {addrDisplay.state} — {addrDisplay.postcode}
                      </p>
                    </div>
                  ) : (
                    /* Inline Address Selector / Form (No page navigation or screen conflict) */
                    <div className={styles.addressEditorPanel}>
                      {savedAddresses.length > 0 && (
                        <div className={styles.savedAddressPickSection}>
                          <p className={styles.addressSectionSubtitle}>Select a saved delivery address:</p>
                          <div className={styles.savedAddressesList}>
                            {savedAddresses.map((addr) => {
                              const isSelected = selectedAddressId === addr.id && !isAddingNew;
                              return (
                                <div
                                  key={addr.id}
                                  className={`${styles.savedAddressOption} ${isSelected ? styles.savedAddressOptionActive : ''}`}
                                  onClick={() => {
                                    setSelectedAddressId(addr.id);
                                    setIsAddingNew(false);
                                    setAddrError('');
                                  }}
                                >
                                  <div className={styles.savedAddrOptionLeft}>
                                    <input
                                      type="radio"
                                      id={`addr-${addr.id}`}
                                      name="addressSelection"
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedAddressId(addr.id);
                                        setIsAddingNew(false);
                                        setAddrError('');
                                      }}
                                      className={styles.addrRadio}
                                    />
                                    <label htmlFor={`addr-${addr.id}`} className={styles.savedAddrOptionLabel}>
                                      <div className={styles.savedAddrTagWrap}>
                                        <span className={styles.savedAddrTag}>
                                          {addr.tag === 'Home' && <Home size={11} />}
                                          {addr.tag === 'Work' && <Briefcase size={11} />}
                                          {addr.tag === 'Other' && <MapPin size={11} />}
                                          {addr.tag}
                                        </span>
                                        <span className={styles.savedAddrName}>
                                          {[addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Customer'}
                                        </span>
                                        {addr.phone && (
                                          <span className={styles.savedAddrPhone}>• {addr.phone}</span>
                                        )}
                                      </div>
                                      <p className={styles.savedAddrText}>
                                        {addr.address1}
                                        {addr.address2 ? `, ${addr.address2}` : ''}, {addr.city}, {addr.state} — {addr.postcode}
                                      </p>
                                    </label>
                                  </div>
                                  {isSelected && (
                                    <button
                                      type="button"
                                      className={styles.deliverHereBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAddressId(addr.id);
                                        setIsAddingNew(false);
                                        setIsChangingAddress(false);
                                        setAddrError('');
                                      }}
                                    >
                                      Deliver Here
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* "+ Add New Address" button styled like the account page */}
                      {!isAddingNew && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            className={styles.addAddressCheckoutBtn}
                            onClick={() => {
                              setIsAddingNew(true);
                              setAddrForm({
                                ...EMPTY_ADDR,
                                email: user?.email || '',
                                first_name: user?.name?.split(' ')[0] || '',
                                last_name: user?.name?.split(' ').slice(1).join(' ') || '',
                              });
                              setAddrError('');
                            }}
                          >
                            <Plus size={16} /> Add New Address
                          </button>
                        </div>
                      )}

                      {/* New Address Form (Expands when "+ Add New Address" is clicked or when no saved addresses exist) */}
                      {(isAddingNew || savedAddresses.length === 0) && (
                        <div className={styles.newAddressSection}>
                          <div className={styles.newAddressTitleRow}>
                            <h4 className={styles.newAddressFormTitle}>Add New Delivery Address</h4>
                            {savedAddresses.length > 0 && (
                              <button
                                type="button"
                                className={styles.closeNewAddrBtn}
                                onClick={() => {
                                  setIsAddingNew(false);
                                  setAddrError('');
                                }}
                              >
                                <X size={15} /> Close
                              </button>
                            )}
                          </div>

                          {/* Address Type Tag Picker (Home, Work, Other) */}
                          <div className={styles.tagPickerWrap}>
                            <label className={styles.inputLabel}>Address Tag</label>
                            <div className={styles.tagOptionsRow}>
                              {(['Home', 'Work', 'Other'] as const).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  className={`${styles.tagOptionBtn} ${addrTag === t ? styles.tagOptionActive : ''}`}
                                  onClick={() => setAddrTag(t)}
                                >
                                  {t === 'Home' && <Home size={13} />}
                                  {t === 'Work' && <Briefcase size={13} />}
                                  {t === 'Other' && <MapPin size={13} />}
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={styles.addrFormInner}>
                            <div className={styles.row2}>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>First Name *</label>
                                <input
                                  value={addrForm.first_name}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, first_name: e.target.value }))}
                                  required
                                  placeholder="First name"
                                  className={styles.input}
                                />
                              </div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Last Name</label>
                                <input
                                  value={addrForm.last_name}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, last_name: e.target.value }))}
                                  placeholder="Last name (optional)"
                                  className={styles.input}
                                />
                              </div>
                            </div>

                            <div className={styles.row2}>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Mobile Phone *</label>
                                <input
                                  type="tel"
                                  value={addrForm.phone}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value }))}
                                  required
                                  placeholder="10-digit mobile number"
                                  className={styles.input}
                                />
                              </div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Email Address *</label>
                                <input
                                  type="email"
                                  value={addrForm.email}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, email: e.target.value }))}
                                  required
                                  placeholder="you@email.com"
                                  className={styles.input}
                                />
                              </div>
                            </div>

                            {/* GPS Location Button */}
                            <div className={styles.locationRow}>
                              <button
                                type="button"
                                className={`${styles.locationBtn} ${locLoading ? styles.locationBtnBusy : ''} ${locSuccess ? styles.locationBtnSuccess : ''}`}
                                onClick={useCurrentLocation}
                                disabled={locLoading}
                              >
                                {locLoading ? (
                                  <><span className={styles.locSpinner} /> Detecting location…</>
                                ) : locSuccess ? (
                                  <><Navigation size={15} /> Location detected!</>
                                ) : (
                                  <><LocateFixed size={15} /> Use current GPS location</>
                                )}
                              </button>
                              <span className={styles.locationOr}>or fill manually below</span>
                            </div>

                            {locError && (
                              <div className={styles.locErrorBox}>
                                <TriangleAlert size={13} /> {locError}
                              </div>
                            )}

                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>House / Flat / Building / Street *</label>
                              <input
                                value={addrForm.address_1}
                                onChange={(e) => setAddrForm((p) => ({ ...p, address_1: e.target.value }))}
                                required
                                placeholder="Flat no, building, road"
                                className={styles.input}
                              />
                            </div>

                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Area / Landmark (Optional)</label>
                              <input
                                value={addrForm.address_2 || ''}
                                onChange={(e) => setAddrForm((p) => ({ ...p, address_2: e.target.value }))}
                                placeholder="Area, colony or nearby landmark"
                                className={styles.input}
                              />
                            </div>

                            <div className={styles.row3}>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>City *</label>
                                <input
                                  value={addrForm.city}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                                  required
                                  placeholder="City"
                                  className={styles.input}
                                />
                              </div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>State *</label>
                                <input
                                  value={addrForm.state}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))}
                                  required
                                  placeholder="State"
                                  className={styles.input}
                                />
                              </div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>PIN Code *</label>
                                <input
                                  value={addrForm.postcode}
                                  onChange={(e) => setAddrForm((p) => ({ ...p, postcode: e.target.value }))}
                                  required
                                  placeholder="6-digit PIN"
                                  maxLength={6}
                                  className={styles.input}
                                />
                              </div>
                            </div>

                            {/* "Save as new address" Checkbox */}
                            {user && (
                              <label className={styles.saveAddressCheckboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={saveToAccount}
                                  onChange={(e) => setSaveToAccount(e.target.checked)}
                                  className={styles.addrCheckbox}
                                />
                                <span>Save as new address to my account for future orders</span>
                              </label>
                            )}

                            {addrError && (
                              <div className={styles.errorBox} style={{ margin: '0.6rem 0' }}>
                                <TriangleAlert size={14} /> {addrError}
                              </div>
                            )}

                            <div className={styles.addressFormActions}>
                              <button
                                type="button"
                                className={styles.deliverToThisBtn}
                                onClick={async () => {
                                  if (!addrForm.first_name?.trim()) {
                                    setAddrError('Please enter your name.');
                                    return;
                                  }
                                  const cleanPhone = (addrForm.phone || '').replace(/\D/g, '');
                                  if (!cleanPhone || cleanPhone.length < 10) {
                                    setAddrError('Please enter a valid 10-digit mobile number for delivery & SMS updates.');
                                    return;
                                  }
                                  if (!addrForm.email?.trim() || !addrForm.email.includes('@')) {
                                    setAddrError('Please enter a valid email address for order confirmation.');
                                    return;
                                  }
                                  if (!addrForm.address_1?.trim()) {
                                    setAddrError('Please enter your house / flat / street address.');
                                    return;
                                  }
                                  if (!addrForm.city?.trim()) {
                                    setAddrError('Please enter your city.');
                                    return;
                                  }
                                  if (!addrForm.postcode?.trim() || addrForm.postcode.trim().length < 6) {
                                    setAddrError('Please enter a valid 6-digit PIN code.');
                                    return;
                                  }
                                  setAddrError('');

                                  // If saveToAccount is checked and user is logged in, save to savedAddresses & WooCommerce
                                  if (user && saveToAccount) {
                                    const newSaved: SavedAddress = {
                                      id: `addr-${Date.now()}`,
                                      tag: addrTag,
                                      firstName: addrForm.first_name.trim(),
                                      lastName: (addrForm.last_name || '').trim(),
                                      address1: addrForm.address_1.trim(),
                                      address2: (addrForm.address_2 || '').trim(),
                                      city: addrForm.city.trim(),
                                      state: addrForm.state.trim(),
                                      postcode: addrForm.postcode.trim(),
                                      country: 'IN',
                                      phone: addrForm.phone.trim(),
                                      isDefault: true,
                                    };
                                    const updated = [newSaved, ...savedAddresses.map((a) => ({ ...a, isDefault: false }))];
                                    setSavedAddresses(updated);
                                    setSelectedAddressId(newSaved.id);
                                    try {
                                      localStorage.setItem(`intersting_saved_addresses_${user.id}`, JSON.stringify(updated));
                                    } catch {}

                                    // Background sync to WooCommerce customer profile
                                    fetch('/api/account/address', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        firstName: newSaved.firstName,
                                        lastName: newSaved.lastName,
                                        address1: newSaved.address1,
                                        address2: newSaved.address2,
                                        city: newSaved.city,
                                        state: newSaved.state,
                                        postcode: newSaved.postcode,
                                        country: 'IN',
                                        phone: newSaved.phone,
                                      }),
                                    }).catch(console.warn);
                                  }

                                  setIsAddingNew(false);
                                  setIsChangingAddress(false);
                                }}
                              >
                                <Check size={16} /> Deliver to this Address
                              </button>

                              {savedAddresses.length > 0 && (
                                <button
                                  type="button"
                                  className={styles.cancelAddressBtn}
                                  onClick={() => {
                                    setIsAddingNew(false);
                                    setIsChangingAddress(false);
                                    setAddrError('');
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.cardDivider} />

                {/* ── 2. PAYMENT METHOD SECTION ── */}
                <div className={styles.paymentBlock}>
                  <div className={styles.blockHeadingRow}>
                    <div className={styles.blockHeadingLeft}>
                      <CreditCard size={16} className={styles.blockIcon} />
                      <h3 className={styles.blockHeading}>Payment Method</h3>
                    </div>
                  </div>

                <div className={styles.paymentOptions}>
                  {[
                    {
                      id: 'razorpay',
                      Icon: RazorpayIcon,
                      label: 'Online Payment',
                      sub: 'Instant & secure checkout via Razorpay • Supports Google Pay, PhonePe, Paytm, CRED, Cards, Netbanking',
                      badge: 'Recommended',
                    },
                    {
                      id: 'cod',
                      Icon: Banknote,
                      label: 'Cash on Delivery',
                      sub: 'Pay at your doorstep via Cash or scan delivery partner UPI QR upon arrival',
                      badge: 'COD',
                    },
                    {
                      id: 'upi',
                      icon: 'UPI',
                      label: 'Direct Manual UPI Transfer',
                      sub: 'Scan QR code & enter 12-digit UPI Reference (UTR)',
                      badge: 'Manual QR',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`${styles.paymentOpt} ${payMethod === opt.id ? styles.paymentOptActive : ''}`}
                      htmlFor={`pay-${opt.id}`}
                    >
                      <input
                        type="radio"
                        id={`pay-${opt.id}`}
                        name="payment"
                        value={opt.id}
                        checked={payMethod === (opt.id as PaymentMethod)}
                        onChange={() => {
                          setPayMethod(opt.id as PaymentMethod);
                          setOrderError('');
                        }}
                        className={styles.radioInput}
                      />
                      <div className={styles.payOptLeft}>
                        <span className={styles.payOptIcon}>
                          {'icon' in opt ? <span className={styles.upiIcon}>{opt.icon}</span> : <opt.Icon size={20} />}
                        </span>
                        <div className={styles.payOptInfo}>
                          <div className={styles.payOptHeader}>
                            <span className={styles.payOptLabel}>{opt.label}</span>
                            {opt.badge && <span className={styles.payOptBadge}>{opt.badge}</span>}
                          </div>
                          <span className={styles.payOptSub}>{opt.sub}</span>
                        </div>
                      </div>
                      <span className={styles.radioCircle} />
                    </label>
                  ))}
                </div>

                {payMethod === 'razorpay' && (
                  <div className={styles.codNote}>
                    <RazorpayIcon size={20} />
                    <span><strong>100% Encrypted &amp; Secure Payment:</strong> Powered by Razorpay. Complete your payment with any UPI App (GPay, PhonePe, Paytm, CRED), Debit/Credit Card, or 50+ Netbanking banks.</span>
                  </div>
                )}

                {payMethod === 'cod' && (
                  <div className={styles.codNote}>
                    <ShieldCheck size={18} />
                    <span><strong>100% Safe &amp; Contactless Delivery:</strong> You can pay in cash or scan the delivery executive&apos;s UPI QR code upon arrival.</span>
                  </div>
                )}

                {payMethod === 'upi' && (
                  <div className={styles.upiBox}>
                    <div className={styles.upiHeader}>
                      <span className={styles.upiTitle}>Scan QR or Transfer via UPI</span>
                      <span className={styles.upiIdBadge}>
                        {process.env.NEXT_PUBLIC_STORE_UPI_ID || '9994847167@upi'}
                        <button
                          type="button"
                          className={styles.upiCopyBtn}
                          onClick={() => {
                            navigator.clipboard.writeText(process.env.NEXT_PUBLIC_STORE_UPI_ID || '9994847167@upi');
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          title="Copy UPI ID"
                        >
                          <Copy size={13} /> {copiedUpi ? 'Copied!' : 'Copy'}
                        </button>
                      </span>
                    </div>

                    <div className={styles.upiQrArea}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          `upi://pay?pa=${process.env.NEXT_PUBLIC_STORE_UPI_ID || '9994847167@upi'}&pn=${encodeURIComponent(
                            process.env.NEXT_PUBLIC_STORE_UPI_NAME || 'INTERSTING'
                          )}&am=${grandTotal}&cu=INR&tn=Order_Payment`
                        )}`}
                        alt="UPI Payment QR Code"
                        className={styles.upiQrImg}
                      />
                      <div className={styles.upiInstructions}>
                        <div><strong>Step 1:</strong> Scan QR with GPay, PhonePe, Paytm, or any UPI app.</div>
                        <div><strong>Step 2:</strong> Pay exact order total of <strong>{formatPrice(grandTotal)}</strong>.</div>
                        <div><strong>Step 3:</strong> Paste the 12-digit <strong>UPI Reference / UTR Number</strong> below to confirm.</div>

                        <a
                          href={`upi://pay?pa=${process.env.NEXT_PUBLIC_STORE_UPI_ID || '9994847167@upi'}&pn=${encodeURIComponent(
                            process.env.NEXT_PUBLIC_STORE_UPI_NAME || 'INTERSTING'
                          )}&am=${grandTotal}&cu=INR&tn=Order_Payment`}
                          className={styles.upiIntentBtn}
                        >
                          <ExternalLink size={14} /> Pay with UPI App on Mobile
                        </a>
                      </div>
                    </div>

                    <div className={styles.upiInputGroup}>
                      <label htmlFor="upi-ref-input" className={styles.upiInputLabel}>
                        12-digit UPI Reference / UTR Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        id="upi-ref-input"
                        type="text"
                        placeholder="e.g. 412356789012"
                        value={upiRef}
                        onChange={(e) => setUpiRef(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                        maxLength={22}
                        className={styles.upiInput}
                      />
                    </div>
                  </div>
                )}

                {orderError && (
                  <div className={styles.errorBox}><TriangleAlert size={14} /> {orderError}</div>
                )}

                <button
                  type="button"
                  className={styles.placeOrderBtn}
                  onClick={placeOrder}
                  disabled={placing || orderFlowState !== 'idle'}
                  aria-label="Complete Order"
                >
                  <span className={`${styles.btnText} ${styles.defaultText}`}>
                    {placing || orderFlowState !== 'idle' ? (
                      <><CheckCircle2 size={17} /> Placing Order...</>
                    ) : payMethod === 'razorpay' ? (
                      <><RazorpayIcon size={18} /> Pay {formatPrice(grandTotal)} via Razorpay</>
                    ) : payMethod === 'cod' ? (
                      <><ShieldCheck size={17} /> Place Order • {formatPrice(grandTotal)}</>
                    ) : (
                      <><CheckCircle2 size={17} /> Confirm UPI Order — {formatPrice(grandTotal)}</>
                    )}
                  </span>
                </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Summary ── */}
          <aside className={styles.sideCol}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryHeading}>
                <Package size={16} /> Your Order ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h3>

              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.productId} className={styles.summaryItem}>
                    {item.image && (
                      <Link
                        href={item.slug ? `/product/${item.slug}` : `/shop`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.itemThumb}
                        title={`View ${item.name}`}
                      >
                        <Image src={item.image} alt={item.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                      </Link>
                    )}
                    <div className={styles.itemInfo}>
                      <Link
                        href={item.slug ? `/product/${item.slug}` : `/shop`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.itemName}
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                      <span className={styles.itemQty}>Qty: {item.quantity}</span>
                    </div>
                    <span className={styles.itemTotal}>
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className={styles.couponSection}>
                {appliedCoupon ? (
                  <div className={styles.appliedCoupon}>
                    <Tag size={14} />
                    <span className={styles.couponCode}>{appliedCoupon.code}</span>
                    <span className={styles.couponSaving}>
                      {discount > 0 ? `−${formatPrice(discount)} saved` : isFreeShippingByCoupon ? 'Free Shipping Applied' : 'Coupon Applied'}
                    </span>
                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponError(''); }} className={styles.removeCoupon}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button type="button" className={styles.couponToggle} onClick={() => setCouponOpen((v) => !v)}>
                      <Tag size={14} />
                      <span>Apply Coupon Code</span>
                      <ChevronDown size={14} className={`${styles.couponChevron} ${couponOpen ? styles.couponChevronOpen : ''}`} />
                    </button>
                    {couponOpen && (
                      <div className={styles.couponInputRow}>
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                          className={styles.couponInput}
                          disabled={applyingCoupon}
                        />
                        <button
                          type="button"
                          onClick={() => applyCoupon()}
                          className={styles.couponApplyBtn}
                          disabled={applyingCoupon || !couponInput.trim()}
                        >
                          {applyingCoupon ? 'Checking…' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className={styles.couponError}>{couponError}</p>}
                    {availableCoupons.length > 0 && (
                      <div className={styles.couponHints}>
                        {availableCoupons.map((c) => (
                          <button
                            key={c.id || c.code}
                            type="button"
                            className={styles.couponHint}
                            onClick={() => applyCoupon(c.code)}
                            title={`${c.code}: ${c.description}`}
                          >
                            <span>{c.code}</span>
                            {c.description && (
                              <span style={{ opacity: 0.85, fontSize: '0.64rem', marginLeft: '4px' }}>
                                • {c.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Price breakdown */}
              <div className={styles.priceSummary}>
                <div className={styles.priceRow}>
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>Delivery</span>
                  <span className={delivery === 0 ? styles.freeTag : ''}>
                    {delivery === 0 ? '🎁 FREE' : formatPrice(delivery)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className={`${styles.priceRow} ${styles.discountRow}`}>
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className={delivery === 0 ? styles.freeDeliveryNote : styles.deliveryUpgrade}>
                  <Truck size={12} />
                  {delivery === 0
                    ? isFreeShippingByCoupon
                      ? ' 🎁 Free delivery unlocked by coupon!'
                      : ' Free delivery on orders above ₹499'
                    : ` Add ${formatPrice(499 - subtotal)} more for free delivery`}
                </div>
              </div>

              <div className={styles.grandTotalRow}>
                <span className={styles.grandTotalLabel}>To Pay</span>
                <span className={styles.grandTotalAmount}>{formatPrice(grandTotal)}</span>
              </div>

              {discount > 0 && (
                <div className={styles.savingsBadge}>
                  <Sparkles size={13} /> You're saving {formatPrice(discount)} on this order!
                </div>
              )}
            </div>

            <div className={styles.trustRow}>
              <div className={styles.trustItem}>
                <ShieldCheck size={15} className={styles.trustIcon} /><span>Secure</span>
              </div>
              <div className={styles.trustItem}>
                <Truck size={15} className={styles.trustIcon} /><span>Fast Delivery</span>
              </div>
              <div className={styles.trustItem}>
                <Clock size={15} className={styles.trustIcon} /><span>3–5 Days</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Seamless Centered Order Micro-Interaction & Confirmation Overlay ── */}
      {orderFlowState !== 'idle' && (
        <div className={styles.centerFlowOverlay} role="dialog" aria-modal="true" aria-label="Order Status">
          <div
            className={`${styles.centerFlowCard} ${
              orderFlowState === 'confirmed' ? styles.centerFlowCardExpanded : ''
            }`}
          >
            {orderFlowState === 'animating' ? (
              <div className={styles.centerAnimBox}>
                {/* ── Self-contained truck track pill (looping payment loader) ── */}
                <div className={styles.truckTrackPill} role="status" aria-label="Processing order">
                  <span className={styles.roadLine} aria-hidden="true" />
                  <span className={styles.package} aria-hidden="true" />

                  <span className={styles.truck} aria-hidden="true">
                    <span className={styles.speedLines}>
                      <span /><span /><span />
                    </span>
                    <span className={styles.truckBody}>
                      <span className={styles.truckCargo}>
                        <span className={styles.cargoDoor} />
                      </span>
                      <span className={styles.truckCab}>
                        <span className={styles.truckWindshield} />
                        <span className={styles.truckHeadlight} />
                        <span className={styles.truckBumper} />
                        <span className={styles.headlightBeam} />
                      </span>
                      <span className={styles.truckChassis} />
                    </span>
                    <span className={`${styles.wheel} ${styles.wheelBack}`} />
                    <span className={`${styles.wheel} ${styles.wheelFront}`} />
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.centerSuccessContent}>
                <div className={styles.successCircle}>
                  <CheckCircle2 size={42} strokeWidth={2.2} />
                </div>

                <h2 className={styles.successTitle}>Order Placed! 🎉</h2>
                <p className={styles.successOrderNum}>
                  Order #{confirmedOrder?.id || orderId}
                </p>

                <p className={styles.successMsg}>
                  Your farm-fresh gourmet items are confirmed and being packed with care.
                  Expected delivery in <strong>3–5 business days</strong>.
                </p>

                <div className={styles.successSummaryBox}>
                  <div className={styles.successSummaryRow}>
                    <span>Items</span>
                    <span>
                      {confirmedOrder?.itemCount ?? (items.length || 1)}{' '}
                      {(confirmedOrder?.itemCount ?? (items.length || 1)) === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className={styles.successSummaryRow}>
                    <span>Total Amount</span>
                    <span className={styles.successAmount}>
                      {formatPrice(confirmedOrder?.total ?? grandTotal)}
                    </span>
                  </div>
                  <div className={styles.successSummaryRow}>
                    <span>Payment Method</span>
                    <span>
                      {confirmedOrder?.paymentTitle ??
                        (payMethod === 'cod' ? 'Cash on Delivery' : 'Direct UPI Transfer')}
                    </span>
                  </div>
                  <div className={styles.successSummaryRow}>
                    <span>Status</span>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>
                      Confirmed &amp; Processing
                    </span>
                  </div>
                </div>

                {isGuest && (
                  <p style={{ fontSize: '0.82rem', color: '#475569', textAlign: 'center', margin: '0.5rem 0 0.85rem', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    📱 Order updates and real-time dispatch tracking will be sent directly via SMS to your mobile.
                  </p>
                )}

                <div className={styles.successActions}>
                  {(confirmedOrder?.id || orderId) && (
                    <a
                      href={`/api/invoice/${confirmedOrder?.id || orderId}/download`}
                      download={`Invoice-INTERSTING-${confirmedOrder?.id || orderId}.pdf`}
                      className={styles.successInvoiceBtn}
                      title="Download official tax invoice (PDF)"
                    >
                      <FileText size={16} /> Download Tax Invoice (PDF)
                    </a>
                  )}
                  <div className={styles.successSubActions}>
                    <Link href={user ? "/account" : "/shop"} className={styles.successTrackBtn}>
                      <Package size={16} /> {user ? "Track Order" : "View More Products"}
                    </Link>
                    <Link href="/shop" className={styles.successShopBtn}>
                      Continue Shopping <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
