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
} from 'lucide-react';
import type { OrderBilling } from '@/types';
import styles from './page.module.css';

type CheckoutStep = 'auth' | 'address' | 'payment' | 'success';
type AuthMode = 'login' | 'signup';
type PaymentMethod = 'cod' | 'upi' | 'card';

interface WooCommerceCoupon {
  id: number;
  code: string;
  amount: number;
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
  description: string;
  minimum_amount: number;
  maximum_amount: number;
}

interface ConfirmedOrder {
  id: number;
  total: number;
  itemCount: number;
  paymentTitle: string;
}

const EMPTY_ADDR: OrderBilling = {
  first_name: '', last_name: '', email: '', phone: '',
  address_1: '', address_2: '', city: '', state: '', postcode: '', country: 'IN',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartContext();
  const { user, customer, loading: authLoading, loginWithEmail, signupWithEmail, refresh } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved');
  const [addrForm, setAddrForm] = useState<OrderBilling>(EMPTY_ADDR);

  const [availableCoupons, setAvailableCoupons] = useState<WooCommerceCoupon[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<WooCommerceCoupon | null>(null);

  const [payMethod, setPayMethod] = useState<PaymentMethod>('cod');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

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

  /* ── Auto-advance step on auth change ── */
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const hasAddr = !!(customer?.shipping?.address_1 || customer?.billing?.address_1);
      setStep(hasAddr ? 'payment' : 'address');
      if (customer) {
        const s = customer.shipping;
        const b = customer.billing;
        setAddrForm({
          first_name: s?.first_name || b?.first_name || '',
          last_name:  s?.last_name  || b?.last_name  || '',
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
    } else {
      setStep('auth');
    }
  }, [user, customer, authLoading]);

  /* ── Redirect empty cart ── */
  useEffect(() => {
    if (!authLoading && items.length === 0 && !confirmedOrder && orderId === null && step !== 'success') {
      router.replace('/cart');
    }
  }, [items.length, orderId, confirmedOrder, step, authLoading, router]);

  /* ── Pricing ── */
  const subtotal = parseFloat(total) || 0;
  const delivery = subtotal >= 499 ? 0 : 49;
  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percent'
      ? Math.round((subtotal * appliedCoupon.amount) / 100)
      : appliedCoupon.amount
    : 0;
  const grandTotal = Math.max(0, subtotal + delivery - discount);

  /* ── Saved address ── */
  const hasSaved = !!(customer?.shipping?.address_1 || customer?.billing?.address_1);

  function getAddr(): OrderBilling {
    if (hasSaved && addressMode === 'saved') {
      const s = customer!.shipping;
      const b = customer!.billing;
      return {
        first_name: s?.first_name || b?.first_name || '',
        last_name:  s?.last_name  || b?.last_name  || '',
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
      if (c.minimum_amount > 0 && subtotal < c.minimum_amount) {
        setCouponError(`Minimum order value of ₹${c.minimum_amount} required for this coupon.`);
        return;
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
          setLocError('Location permission denied. Please allow access and try again.');
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
    if (!addr.address_1 || !addr.city || !addr.postcode) {
      setOrderError('Please add a delivery address first.');
      setPlacing(false);
      setStep('address');
      return;
    }

    const finalBilling: OrderBilling = {
      ...addr,
      first_name: addr.first_name || user?.name?.split(' ')[0] || 'Customer',
      last_name: addr.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
      email: addr.email || user?.email || '',
      phone: addr.phone || '',
    };

    const orderItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const orderGrandTotal = grandTotal;
    const orderPaymentTitle = payMethod === 'cod' ? 'Cash on Delivery' : payMethod === 'upi' ? 'UPI' : 'Card';

    try {
      const order = await createOrder({
        customer_id: user?.id,
        payment_method: payMethod === 'cod' ? 'cod' : (payMethod === 'upi' ? 'bacs' : 'bacs'),
        payment_method_title: orderPaymentTitle,
        set_paid: false,
        billing: finalBilling,
        shipping: finalBilling,
        line_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        coupon_code: appliedCoupon?.code,
        discount_amount: discount > 0 ? discount : undefined,
        shipping_lines: [
          {
            method_id: delivery === 0 ? 'free_shipping' : 'flat_rate',
            method_title: delivery === 0 ? 'Free Express Delivery' : 'Standard Delivery',
            total: String(delivery),
          },
        ],
      });

      // Save confirmed order snapshot first so the success screen displays immediately
      setConfirmedOrder({
        id: order.id,
        total: orderGrandTotal,
        itemCount: orderItemCount,
        paymentTitle: orderPaymentTitle,
      });
      setOrderId(order.id);
      setStep('success');

      // Now clear the cart and refresh auth orders in the background
      clearCart();
      refresh?.();
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  /* ── Loading ── */
  if (authLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Loading checkout…</p>
      </div>
    );
  }

  /* ── Success screen ── */
  if (step === 'success' || confirmedOrder) {
    const oId = confirmedOrder?.id || orderId;
    const oTotal = confirmedOrder?.total ?? grandTotal;
    const oItems = confirmedOrder?.itemCount ?? (items.length || 1);
    const oPay = confirmedOrder?.paymentTitle ?? (payMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment');

    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
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
          <div className={styles.successActions}>
            <Link href="/account" className={styles.successTrackBtn}>
              <Package size={16} /> Track Order
            </Link>
            <Link href="/shop" className={styles.successShopBtn}>
              Continue Shopping <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !confirmedOrder) return null;

  const addrDisplay = getAddr();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── Progress stepper ── */}
        <div className={styles.stepper}>
          {(['auth', 'address', 'payment'] as const).map((s, i) => {
            const labels = ['Account', 'Address', 'Payment'];
            const stepOrder = { auth: 0, address: 1, payment: 2, success: 3 };
            const current = stepOrder[step];
            const me = stepOrder[s];
            const isActive = step === s;
            const isDone = current > me;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className={`${styles.stepPill} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}>
                  {isDone ? <CheckCircle2 size={14} /> : <span className={styles.stepNum}>{i + 1}</span>}
                  <span>{labels[i]}</span>
                </div>
                {i < 2 && <div className={`${styles.stepLine} ${current > me ? styles.stepLineDone : ''}`} />}
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

                  <button type="submit" className={styles.primaryBtn} disabled={authBusy}>
                    {authBusy
                      ? <span className={styles.btnSpinner} />
                      : authMode === 'login'
                        ? <><LogIn size={16} /> Login & Continue</>
                        : <><UserPlus size={16} /> Create Account & Continue</>
                    }
                  </button>
                </form>

                <p className={styles.guestNote}>
                  <Sparkles size={13} />
                  Create an account to track orders, save addresses & get exclusive offers
                </p>
              </div>
            )}

            {/* STEP 2 — Address */}
            {step === 'address' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}><MapPin size={18} /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Delivery Address</h2>
                    <p className={styles.cardSubtitle}>Where should we deliver your order?</p>
                  </div>
                </div>

                {hasSaved && (
                  <div className={styles.savedAddressToggle}>
                    <button type="button"
                      className={`${styles.addrToggleBtn} ${addressMode === 'saved' ? styles.addrToggleActive : ''}`}
                      onClick={() => setAddressMode('saved')}>
                      <MapPin size={14} /> Saved Address
                    </button>
                    <button type="button"
                      className={`${styles.addrToggleBtn} ${addressMode === 'new' ? styles.addrToggleActive : ''}`}
                      onClick={() => setAddressMode('new')}>
                      <Plus size={14} /> New Address
                    </button>
                  </div>
                )}

                {hasSaved && addressMode === 'saved' && (() => {
                  const a = getAddr();
                  const name = `${a.first_name} ${a.last_name}`.trim();
                  return (
                    <div className={styles.savedAddrCard}>
                      <div className={styles.savedAddrTop}>
                        <div className={styles.savedAddrTagWrap}>
                          <span className={styles.savedAddrTag}><MapPin size={11} /> Home</span>
                          {name && <span className={styles.savedAddrName}>{name}</span>}
                        </div>
                        <button type="button" className={styles.editAddrBtn} onClick={() => setAddressMode('new')}>
                          <Edit2 size={13} /> Change
                        </button>
                      </div>
                      <p className={styles.savedAddrText}>{a.address_1}</p>
                      {a.address_2 && <p className={styles.savedAddrText}>{a.address_2}</p>}
                      <p className={styles.savedAddrCity}>{a.city}, {a.state} — {a.postcode}</p>
                      {a.phone && <p className={styles.savedAddrPhone}><Phone size={12} /> {a.phone}</p>}
                    </div>
                  );
                })()}

                {(!hasSaved || addressMode === 'new') && (
                  <div className={styles.addrForm}>
                    <div className={styles.row2}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>First Name *</label>
                        <input value={addrForm.first_name} onChange={(e) => setAddrForm((p) => ({ ...p, first_name: e.target.value }))}
                          required placeholder="First name" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Last Name *</label>
                        <input value={addrForm.last_name} onChange={(e) => setAddrForm((p) => ({ ...p, last_name: e.target.value }))}
                          required placeholder="Last name" className={styles.input} />
                      </div>
                    </div>
                    <div className={styles.row2}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Email *</label>
                        <input type="email" value={addrForm.email} onChange={(e) => setAddrForm((p) => ({ ...p, email: e.target.value }))}
                          required placeholder="Email" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Phone *</label>
                        <input type="tel" value={addrForm.phone} onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value }))}
                          required placeholder="+91 98765 43210" className={styles.input} />
                      </div>
                    </div>
                    {/* GPS Location button */}
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
                          <><LocateFixed size={15} /> Use current location</>  
                        )}
                      </button>
                      <span className={styles.locationOr}>or enter manually below</span>
                    </div>

                    {locError && (
                      <div className={styles.locErrorBox}>
                        <TriangleAlert size={13} /> {locError}
                      </div>
                    )}

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>House / Flat / Building *</label>
                      <input value={addrForm.address_1} onChange={(e) => setAddrForm((p) => ({ ...p, address_1: e.target.value }))}
                        required placeholder="Flat no, building name, street" className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Area / Landmark</label>
                      <input value={addrForm.address_2 || ''} onChange={(e) => setAddrForm((p) => ({ ...p, address_2: e.target.value }))}
                        placeholder="Area or nearby landmark (optional)" className={styles.input} />
                    </div>
                    <div className={styles.row3}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>City *</label>
                        <input value={addrForm.city} onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                          required placeholder="City" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>State *</label>
                        <input value={addrForm.state} onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))}
                          required placeholder="State" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Pincode *</label>
                        <input value={addrForm.postcode} onChange={(e) => setAddrForm((p) => ({ ...p, postcode: e.target.value }))}
                          required placeholder="110001" maxLength={6} className={styles.input} />
                      </div>
                    </div>
                  </div>
                )}

                <button type="button" className={styles.primaryBtn}
                  onClick={() => {
                    const a = getAddr();
                    if (!a.address_1 || !a.city || !a.postcode) return;
                    setStep('payment');
                  }}>
                  Continue to Payment <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 3 — Payment */}
            {step === 'payment' && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}><CreditCard size={18} /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Payment Method</h2>
                    <p className={styles.cardSubtitle}>Select how you'd like to pay</p>
                  </div>
                </div>

                {addrDisplay.address_1 && (
                  <div className={styles.addrSummaryChip}>
                    <MapPin size={13} className={styles.addrChipIcon} />
                    <span className={styles.addrChipText}>
                      Delivering to: {addrDisplay.address_1}, {addrDisplay.city} — {addrDisplay.postcode}
                    </span>
                    <button type="button" className={styles.addrChipChange} onClick={() => setStep('address')}>
                      Change
                    </button>
                  </div>
                )}

                <div className={styles.paymentOptions}>
                  {[
                    { id: 'cod',  Icon: Banknote,   label: 'Cash on Delivery',      sub: 'Pay when your order arrives', badge: null    },
                    { id: 'upi',  icon: 'UPI',       label: 'UPI / PhonePe / GPay',  sub: 'Instant payment via UPI',    badge: 'Popular' },
                    { id: 'card', Icon: CreditCard,  label: 'Credit / Debit Card',   sub: 'Visa, Mastercard, RuPay',    badge: null    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`${styles.paymentOpt} ${payMethod === opt.id ? styles.paymentOptActive : ''}`}
                      htmlFor={`pay-${opt.id}`}
                    >
                      <input type="radio" id={`pay-${opt.id}`} name="payment" value={opt.id}
                        checked={payMethod === opt.id as PaymentMethod}
                        onChange={() => setPayMethod(opt.id as PaymentMethod)}
                        className={styles.radioInput} />
                      <span className={styles.payOptIcon}>
                        {'icon' in opt ? <span className={styles.upiIcon}>{opt.icon}</span> : <opt.Icon size={20} />}
                      </span>
                      <span className={styles.payOptInfo}>
                        <span className={styles.payOptLabel}>{opt.label}</span>
                        <span className={styles.payOptSub}>{opt.sub}</span>
                      </span>
                      {opt.badge && <span className={styles.payOptBadge}>{opt.badge}</span>}
                      <span className={styles.radioCircle} />
                    </label>
                  ))}
                </div>

                {payMethod !== 'cod' && (
                  <div className={styles.paymentNote}>
                    <ShieldCheck size={14} />
                    <span>Demo store — no real payment will be charged. Order placed as pending.</span>
                  </div>
                )}

                {orderError && (
                  <div className={styles.errorBox}><TriangleAlert size={14} /> {orderError}</div>
                )}

                <button type="button" className={styles.placeOrderBtn} onClick={placeOrder} disabled={placing}>
                  {placing
                    ? <><span className={styles.btnSpinner} /> Placing Order…</>
                    : <><ShieldCheck size={17} /> Place Order — {formatPrice(grandTotal)}</>
                  }
                </button>
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
                      <div className={styles.itemThumb}>
                        <Image src={item.image} alt={item.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
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
                    <span className={styles.couponSaving}>−{formatPrice(discount)} saved</span>
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
                            title={c.description}
                          >
                            {c.code}
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
                    ? ' Free delivery on orders above ₹499'
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
    </div>
  );
}
