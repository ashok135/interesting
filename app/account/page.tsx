'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  MapPin,
  User,
  Shield,
  LogOut,
  Home,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Check,
  ChevronRight,
  X,
  Phone,
  ArrowRight,
  Clock,
  Truck,
  RotateCcw,
  ShoppingBag,
  HelpCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import { useCartContext } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import { formatPrice } from '@/lib/utils/formatters';
import type { WooOrder } from '@/types';
import styles from './page.module.css';

type TabKey = 'orders' | 'addresses' | 'profile';
type AddressTag = 'Home' | 'Work' | 'Other';

interface SavedAddress {
  id: string;
  tag: AddressTag;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

const ITEM_FALLBACK_IMAGES: Record<string, string> = {
  almond: '/images/categories/nuts.jpg',
  cashew: '/images/categories/nuts.jpg',
  kaju: '/images/categories/nuts.jpg',
  walnut: '/images/categories/dryfruits.jpg',
  seed: '/images/categories/seeds.jpg',
  millet: '/images/categories/millets.jpg',
  snack: '/images/categories/roasted.jpg',
  crisp: '/images/categories/roasted.jpg',
  trail: '/images/categories/trailmix.jpg',
  gift: '/images/categories/gifts.jpg',
};

function getItemImageUrl(item?: { name?: string; image?: { src?: string } } | null): string {
  if (!item) return '/images/categories/nuts.jpg';
  const src = item.image?.src;
  if (src) {
    if (src.includes('/wp-content/uploads/')) {
      const parts = src.split('/wp-content/uploads/');
      return `/api/media/${parts[1]}`;
    }
    return src;
  }
  const lower = (item.name || '').toLowerCase();
  for (const [kw, url] of Object.entries(ITEM_FALLBACK_IMAGES)) {
    if (lower.includes(kw)) return url;
  }
  return '/images/categories/nuts.jpg';
}

export default function AccountPage() {
  const router = useRouter();
  const { user, customer, orders, loading, logout, refresh } = useAuth();
  const { showSuccess, showError } = useToast();
  const { addItem, openDrawer, clearCart } = useCartContext();
  const { clearWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [selectedOrder, setSelectedOrder] = useState<WooOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<WooOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [cancelComments, setCancelComments] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleConfirmCancel() {
    if (!cancellingOrder) return;
    setIsCancelling(true);
    try {
      const reasonText = cancelReason + (cancelComments.trim() ? ` - ${cancelComments.trim()}` : '');
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: cancellingOrder.id, reason: reasonText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel order.');
      }
      showSuccess(`Order #${cancellingOrder.id} has been cancelled successfully.`);
      setCancellingOrder(null);
      setCancelComments('');
      if (selectedOrder?.id === cancellingOrder.id) {
        setSelectedOrder(null);
      }
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not cancel order. Please try again.';
      showError(msg);
    } finally {
      setIsCancelling(false);
    }
  }

  function handleBuyAgain(item: { product_id?: number; id: number; name: string; total: string; price?: number; image?: { src: string } }) {
    const prodId = item.product_id || item.id;
    const unitPrice = item.price ? String(item.price) : String(parseFloat(item.total) || 429);
    addItem({
      id: prodId,
      productId: prodId,
      name: item.name,
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: unitPrice,
      image: item.image?.src || '',
      stockStatus: 'instock',
    });
    showSuccess(`Added "${item.name}" to your bag!`);
    openDrawer();
  }

  // Address state (Zepto / Swiggy style)
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Form State for Add / Edit Address
  const [addressForm, setAddressForm] = useState<{
    tag: AddressTag;
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
  }>({
    tag: 'Home',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'IN',
    phone: '',
    isDefault: true,
  });

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Load addresses from localStorage or WooCommerce
  useEffect(() => {
    if (!user) return;

    const storageKey = `intersting_saved_addresses_${user.id}`;
    let loaded: SavedAddress[] = [];

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        loaded = JSON.parse(stored);
      }
    } catch {
      loaded = [];
    }

    // If no saved addresses exist yet in localStorage, populate from customer shipping/billing
    if (loaded.length === 0 && customer?.shipping) {
      const s = customer.shipping;
      const b = customer.billing;
      if (s.address_1 || s.city) {
        const primaryAddr: SavedAddress = {
          id: 'wc-default',
          tag: 'Home',
          firstName: s.first_name || customer.first_name || user.name.split(' ')[0] || '',
          lastName: s.last_name || customer.last_name || user.name.split(' ').slice(1).join(' ') || '',
          address1: s.address_1 || '',
          address2: s.address_2 || '',
          city: s.city || '',
          state: s.state || '',
          postcode: s.postcode || '',
          country: s.country || 'IN',
          phone: b?.phone || '',
          isDefault: true,
        };
        loaded = [primaryAddr];
        localStorage.setItem(storageKey, JSON.stringify(loaded));
      }
    }

    setAddresses(loaded);

    // Auto-select the default or first address
    const defaultAddr = loaded.find((a) => a.isDefault) || loaded[0];
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
    }
  }, [user, customer]);

  const persistAddresses = (updatedList: SavedAddress[]) => {
    setAddresses(updatedList);
    if (user) {
      localStorage.setItem(`intersting_saved_addresses_${user.id}`, JSON.stringify(updatedList));
    }
  };

  const handleLogout = async () => {
    clearCart();
    clearWishlist();
    await logout();
    showSuccess('You have been signed out.');
    router.push('/login');
  };

  // Select Address (Auto-select for delivery like Zepto/Swiggy)
  const handleSelectAddress = async (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);

    // Mark as default in list
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addr.id,
    }));
    persistAddresses(updated);

    // Sync selected address to WooCommerce customer shipping
    try {
      await fetch('/api/account/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: addr.firstName,
          lastName: addr.lastName,
          address1: addr.address1,
          address2: addr.address2,
          city: addr.city,
          state: addr.state,
          postcode: addr.postcode,
          country: addr.country,
          phone: addr.phone,
        }),
      });
      showSuccess(`Active delivery address set to ${addr.tag} (${addr.city})`);
      await refresh();
    } catch {
      // Background sync, state is already updated locally
    }
  };

  const openNewAddressModal = () => {
    setEditingAddressId(null);
    const parts = (user?.name || '').split(' ');
    setAddressForm({
      tag: 'Home',
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'IN',
      phone: customer?.billing?.phone || '',
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      tag: addr.tag,
      firstName: addr.firstName,
      lastName: addr.lastName,
      address1: addr.address1,
      address2: addr.address2,
      city: addr.city,
      state: addr.state,
      postcode: addr.postcode,
      country: addr.country || 'IN',
      phone: addr.phone,
      isDefault: Boolean(addr.isDefault),
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (addresses.length <= 1) {
      showError('You must have at least one saved delivery address.');
      return;
    }
    const updated = addresses.filter((a) => a.id !== id);
    if (selectedAddressId === id && updated.length > 0) {
      updated[0].isDefault = true;
      setSelectedAddressId(updated[0].id);
    }
    persistAddresses(updated);
    showSuccess('Address removed.');
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);

    try {
      let updatedList: SavedAddress[] = [];

      if (editingAddressId) {
        // Update existing address
        updatedList = addresses.map((a) => {
          if (a.id === editingAddressId) {
            return {
              ...a,
              tag: addressForm.tag,
              firstName: addressForm.firstName,
              lastName: addressForm.lastName,
              address1: addressForm.address1,
              address2: addressForm.address2,
              city: addressForm.city,
              state: addressForm.state,
              postcode: addressForm.postcode,
              country: addressForm.country,
              phone: addressForm.phone,
              isDefault: addressForm.isDefault,
            };
          }
          return addressForm.isDefault ? { ...a, isDefault: false } : a;
        });
      } else {
        // Add new address
        const newAddr: SavedAddress = {
          id: `addr_${Date.now()}`,
          tag: addressForm.tag,
          firstName: addressForm.firstName,
          lastName: addressForm.lastName,
          address1: addressForm.address1,
          address2: addressForm.address2,
          city: addressForm.city,
          state: addressForm.state,
          postcode: addressForm.postcode,
          country: addressForm.country,
          phone: addressForm.phone,
          isDefault: addressForm.isDefault || addresses.length === 0,
        };

        if (newAddr.isDefault) {
          updatedList = addresses.map((a) => ({ ...a, isDefault: false }));
          updatedList.unshift(newAddr);
          setSelectedAddressId(newAddr.id);
        } else {
          updatedList = [...addresses, newAddr];
        }
      }

      persistAddresses(updatedList);

      // Sync active address to WooCommerce
      if (addressForm.isDefault || !editingAddressId) {
        await fetch('/api/account/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: addressForm.firstName,
            lastName: addressForm.lastName,
            address1: addressForm.address1,
            address2: addressForm.address2,
            city: addressForm.city,
            state: addressForm.state,
            postcode: addressForm.postcode,
            country: addressForm.country,
            phone: addressForm.phone,
          }),
        });
        await refresh();
      }

      showSuccess(
        editingAddressId ? 'Address updated successfully!' : 'New delivery address saved!'
      );
      setShowAddressModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating address';
      showError(msg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showError('Please enter your name');
      return;
    }
    try {
      setIsSavingProfile(true);
      const res = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          phone: profilePhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      showSuccess('Profile information updated successfully!');
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating profile';
      showError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    try {
      setIsSavingPassword(true);
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showSuccess('Password updated securely!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing password';
      showError(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div style={{ height: '96px', borderRadius: '18px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div className={styles.dashboardLayout}>
            <div style={{ height: '260px', borderRadius: '18px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ height: '150px', borderRadius: '16px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ height: '150px', borderRadius: '16px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guest State: Prompt to Login / Sign up
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.guestCard}>
            <div className={styles.guestIconWrap}>
              <User size={36} />
            </div>
            <h1 className={styles.guestTitle}>Customer Account</h1>
            <p className={styles.guestDesc}>
              Sign in to view your past orders, track live shipments, and manage your saved delivery details.
            </p>
            <div className={styles.guestActions}>
              <Link href="/login" className={styles.primaryBtn}>
                Sign In
              </Link>
              <Link href="/signup" className={styles.secondaryBtn}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* User Header Banner */}
        <div className={styles.headerBanner}>
          <div className={styles.profileInfo}>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={60}
                height={60}
                unoptimized
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.nameBlock}>
              <h1 className={styles.userName}>{user.name}</h1>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.badges}>
                <span className={styles.memberBadge}>
                  <CheckCircle2 size={13} /> Verified Member
                </span>
                <span className={styles.idBadge}>ID: #{String(user.id).padStart(4, '0')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Tabs & Main Panel Layout */}
        <div className={styles.dashboardLayout}>
          {/* Side Navigation */}
          <aside className={styles.sidebar} aria-label="Account Menu">
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className={styles.navIcon}>
                <Package size={18} />
              </span>
              <span className={styles.navLabel}>
                <span className={styles.labelDesktop}>My Orders</span>
                <span className={styles.labelMobile}>Orders</span>
              </span>
              <span className={styles.navBadge}>{orders.length}</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'addresses' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <span className={styles.navIcon}>
                <MapPin size={18} />
              </span>
              <span className={styles.navLabel}>
                <span className={styles.labelDesktop}>Delivery Addresses</span>
                <span className={styles.labelMobile}>Addresses</span>
              </span>
              {addresses.length > 0 && (
                <span className={styles.navBadge}>{addresses.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveTab('profile');
                if (!profileName) setProfileName(user.name);
                if (!profilePhone && customer?.billing?.phone) {
                  setProfilePhone(customer.billing.phone);
                }
              }}
            >
              <span className={styles.navIcon}>
                <Shield size={18} />
              </span>
              <span className={styles.navLabel}>
                <span className={styles.labelDesktop}>Profile & Security</span>
                <span className={styles.labelMobile}>Profile</span>
              </span>
            </button>

            <div className={styles.sidebarDivider} />

            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutNavItem}
            >
              <span className={styles.navIcon}>
                <LogOut size={18} />
              </span>
              <span className={styles.navLabel}>Sign Out</span>
            </button>
          </aside>

          {/* Main Panel Content */}
          <main className={styles.mainPanel}>
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className={styles.ordersSection}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Your Orders</h2>
                    <p className={styles.panelSubtitle}>
                      View order history, receipts, and live status tracking
                    </p>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <Package size={32} />
                    </div>
                    <h3 className={styles.emptyStateTitle}>No orders placed yet</h3>
                    <p className={styles.emptyStateDesc}>
                      When you order from our farm-fresh collection, your orders and tracking details will appear here.
                    </p>
                    <Link href="/shop" className={styles.shopNowBtn}>
                      Explore Fresh Harvest <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const status = (order.status || '').toLowerCase();
                    const isCompleted = status === 'completed';
                    const isShipped = status === 'shipped' || status === 'in-transit';
                    const isProcessing = status === 'processing';
                    const isOnHold = status === 'on-hold';
                    const isPending = status === 'pending';
                    const isCancelled = status === 'cancelled';
                    const isRefunded = status === 'refunded';
                    const isFailed = status === 'failed';

                    // Customer can cancel if order is in active unfulfilled status
                    const canCancel = ['pending', 'processing', 'on-hold'].includes(status);

                    let statusChipClass = styles.statusChipPending;
                    let statusLabel = order.status.toUpperCase();

                    if (isCompleted) {
                      statusChipClass = styles.statusChipCompleted;
                      statusLabel = 'DELIVERED';
                    } else if (isShipped) {
                      statusChipClass = styles.statusChipShipped;
                      statusLabel = 'SHIPPED';
                    } else if (isProcessing) {
                      statusChipClass = styles.statusChipProcessing;
                      statusLabel = 'CONFIRMED';
                    } else if (isCancelled) {
                      statusChipClass = styles.statusChipCancelled;
                      statusLabel = 'CANCELLED';
                    } else if (isOnHold) {
                      statusChipClass = styles.statusChipOnHold;
                      statusLabel = 'ON HOLD';
                    } else if (isRefunded) {
                      statusChipClass = styles.statusChipRefunded;
                      statusLabel = 'REFUNDED';
                    } else if (isFailed) {
                      statusChipClass = styles.statusChipFailed;
                      statusLabel = 'FAILED';
                    }

                    return (
                      <div key={order.id} className={styles.amazonOrderCard}>
                        {/* ── 1. Top Header Strip (Amazon / Flipkart Style) ── */}
                        <div className={styles.cardHeaderStrip}>
                          <div className={styles.stripCol}>
                            <span className={styles.stripLabel}>ORDER PLACED</span>
                            <span className={styles.stripValue}>
                              {new Date(order.date_created).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className={styles.stripCol}>
                            <span className={styles.stripLabel}>TOTAL</span>
                            <span className={styles.stripValueBold}>{formatPrice(order.total)}</span>
                          </div>
                          <div className={styles.stripCol}>
                            <span className={styles.stripLabel}>SHIP TO</span>
                            <span className={styles.stripValue}>
                              {order.shipping?.first_name || order.billing.first_name || 'Customer'}{' '}
                              {order.shipping?.last_name || order.billing.last_name || ''}
                              {order.shipping?.city ? ` (${order.shipping.city})` : ''}
                            </span>
                          </div>
                          <div className={styles.stripColRight}>
                            <span className={styles.orderIdBadge}>ORDER #{order.id}</span>
                            <span className={`${styles.statusChip} ${statusChipClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        {/* ── 2. Delivery Status Headline ── */}
                        <div className={`${styles.statusHighlightBar} ${isCancelled || isFailed ? styles.statusHighlightBarCancelled : ''}`}>
                          <div className={styles.statusHeadline}>
                            {isCancelled ? (
                              <>
                                <XCircle size={18} className={styles.cancelledCross} />
                                <div>
                                  <strong style={{ color: '#dc2626' }}>Order Cancelled</strong>
                                  <span className={styles.statusSubtext}>This order was cancelled in WooCommerce. No payment or delivery is pending.</span>
                                </div>
                              </>
                            ) : isRefunded ? (
                              <>
                                <RotateCcw size={18} style={{ color: '#7e22ce', flexShrink: 0 }} />
                                <div>
                                  <strong style={{ color: '#7e22ce' }}>Order Cancelled &amp; Refunded</strong>
                                  <span className={styles.statusSubtext}>Payment has been refunded back to your source account.</span>
                                </div>
                              </>
                            ) : isFailed ? (
                              <>
                                <AlertTriangle size={18} className={styles.failedAlert} />
                                <div>
                                  <strong style={{ color: '#dc2626' }}>Payment Failed</strong>
                                  <span className={styles.statusSubtext}>Transaction was not completed. You can re-order using Buy Again.</span>
                                </div>
                              </>
                            ) : isCompleted ? (
                              <>
                                <CheckCircle2 size={18} className={styles.deliveredCheck} />
                                <div>
                                  <strong>Delivered Successfully</strong>
                                  <span className={styles.statusSubtext}>Package was safely handed over to the recipient.</span>
                                </div>
                              </>
                            ) : isShipped ? (
                              <>
                                <Truck size={18} style={{ color: '#0e7490', flexShrink: 0 }} />
                                <div>
                                  <strong>In Transit • Package Shipped</strong>
                                  <span className={styles.statusSubtext}>Your package has been dispatched and is on its way.</span>
                                </div>
                              </>
                            ) : isProcessing ? (
                              <>
                                <span className={styles.livePulse} />
                                <div>
                                  <strong>Arriving in 3–5 Days • Preparing for Dispatch</strong>
                                  <span className={styles.statusSubtext}>Your package has been confirmed and is being packed fresh at the orchard pantry.</span>
                                </div>
                              </>
                            ) : isOnHold ? (
                              <>
                                <AlertCircle size={18} className={styles.onHoldClock} />
                                <div>
                                  <strong>Order On Hold</strong>
                                  <span className={styles.statusSubtext}>Our team is currently verifying order details.</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Clock size={18} className={styles.pendingClock} />
                                <div>
                                  <strong>Order Placed • Awaiting Payment</strong>
                                  <span className={styles.statusSubtext}>Your order details have been securely logged.</span>
                                </div>
                              </>
                            )}
                          </div>
                          <span className={styles.paymentMethodTag}>
                            {order.payment_method_title || (order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment')}
                          </span>
                        </div>

                        {/* ── 3. 4-Stage Mini Progress Tracker ── */}
                        {isCancelled ? (
                          <div className={styles.miniTracker}>
                            <div className={`${styles.trackerStep} ${styles.trackerStepDone}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Order Placed</span>
                            </div>
                            <div className={`${styles.trackerLine} ${styles.trackerLineCancelled}`} />
                            <div className={`${styles.trackerStep} ${styles.trackerStepCancelled}`}>
                              <span className={styles.trackerDot}>
                                <X size={9} strokeWidth={3.5} color="#fff" />
                              </span>
                              <span className={styles.trackerLabel}>Cancelled</span>
                            </div>
                            <div className={styles.trackerLine} />
                            <div className={styles.trackerStep}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Voided</span>
                            </div>
                            <div className={styles.trackerLine} />
                            <div className={styles.trackerStep}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Closed</span>
                            </div>
                          </div>
                        ) : isRefunded ? (
                          <div className={styles.miniTracker}>
                            <div className={`${styles.trackerStep} ${styles.trackerStepDone}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Order Placed</span>
                            </div>
                            <div className={`${styles.trackerLine} ${styles.trackerLineCancelled}`} />
                            <div className={`${styles.trackerStep} ${styles.trackerStepCancelled}`}>
                              <span className={styles.trackerDot}>
                                <X size={9} strokeWidth={3.5} color="#fff" />
                              </span>
                              <span className={styles.trackerLabel}>Cancelled</span>
                            </div>
                            <div className={`${styles.trackerLine} ${styles.trackerLineCancelled}`} />
                            <div className={`${styles.trackerStep} ${styles.trackerStepAmber}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Refunded</span>
                            </div>
                            <div className={styles.trackerLine} />
                            <div className={styles.trackerStep}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Closed</span>
                            </div>
                          </div>
                        ) : isFailed ? (
                          <div className={styles.miniTracker}>
                            <div className={`${styles.trackerStep} ${styles.trackerStepDone}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Order Placed</span>
                            </div>
                            <div className={`${styles.trackerLine} ${styles.trackerLineCancelled}`} />
                            <div className={`${styles.trackerStep} ${styles.trackerStepCancelled}`}>
                              <span className={styles.trackerDot}>
                                <X size={9} strokeWidth={3.5} color="#fff" />
                              </span>
                              <span className={styles.trackerLabel}>Failed</span>
                            </div>
                            <div className={styles.trackerLine} />
                            <div className={styles.trackerStep}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Voided</span>
                            </div>
                            <div className={styles.trackerLine} />
                            <div className={styles.trackerStep}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Closed</span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.miniTracker}>
                            <div className={`${styles.trackerStep} ${styles.trackerStepDone}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Confirmed</span>
                            </div>
                            <div className={`${styles.trackerLine} ${isProcessing || isShipped || isCompleted ? styles.trackerLineActive : ''}`} />
                            <div className={`${styles.trackerStep} ${isProcessing || isShipped || isCompleted ? styles.trackerStepDone : ''}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Packed</span>
                            </div>
                            <div className={`${styles.trackerLine} ${isShipped || isCompleted ? styles.trackerLineActive : ''}`} />
                            <div className={`${styles.trackerStep} ${isShipped || isCompleted ? styles.trackerStepDone : ''}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Shipped</span>
                            </div>
                            <div className={`${styles.trackerLine} ${isCompleted ? styles.trackerLineActive : ''}`} />
                            <div className={`${styles.trackerStep} ${isCompleted ? styles.trackerStepDone : ''}`}>
                              <span className={styles.trackerDot} />
                              <span className={styles.trackerLabel}>Delivered</span>
                            </div>
                          </div>
                        )}

                        {/* ── 4. Product Items List with Photos ── */}
                        <div className={styles.cardItemsList}>
                          {order.line_items.map((item) => (
                            <div key={item.id} className={styles.amazonItemRow}>
                              <div className={styles.itemThumbWrap}>
                                <Image
                                  src={getItemImageUrl(item)}
                                  alt={item.name}
                                  fill
                                  sizes="68px"
                                  className={styles.itemThumbImg}
                                  unoptimized
                                />
                              </div>
                              <div className={styles.itemInfoCol}>
                                <h4 className={styles.itemTitle}>{item.name}</h4>
                                <p className={styles.itemMeta}>
                                  Quantity: <strong>{item.quantity}</strong> • {formatPrice(item.total)}
                                </p>
                              </div>
                              <div className={styles.itemActionCol}>
                                <button
                                  type="button"
                                  onClick={() => handleBuyAgain(item)}
                                  className={styles.buyAgainBtn}
                                  title="Add to cart again"
                                >
                                  <ShoppingBag size={14} /> Buy Again
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ── 5. Action Buttons (Track Package, Details, Cancel, Help) ── */}
                        <div className={styles.cardFooterActions}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={styles.trackPackageBtn}
                          >
                            <Truck size={15} /> Track Package
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={styles.viewOrderDetailsBtn}
                          >
                            View Details
                          </button>
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancellingOrder(order)}
                              className={styles.cancelOrderBtn}
                            >
                              <XCircle size={15} /> Cancel Order
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const msg = `Hi, I need assistance with Order #${order.id} placed on Interesting.`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className={styles.helpBtn}
                          >
                            <HelpCircle size={15} /> Help
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Addresses Tab (Zepto / Swiggy Style) */}
            {activeTab === 'addresses' && (
              <div className={styles.ordersSection}>
                <div className={styles.addressesHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Delivery Addresses</h2>
                    <p className={styles.panelSubtitle}>
                      Select your active delivery address or add new locations (Home, Work, Other)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openNewAddressModal}
                    className={styles.addAddressBtn}
                  >
                    <Plus size={16} /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <MapPin size={32} />
                    </div>
                    <h3 className={styles.emptyStateTitle}>No saved addresses</h3>
                    <p className={styles.emptyStateDesc}>
                      Add a delivery address to enable instant one-click ordering and farm-fresh doorstep drop.
                    </p>
                    <button
                      type="button"
                      onClick={openNewAddressModal}
                      className={styles.shopNowBtn}
                    >
                      <Plus size={16} /> Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className={styles.addressGrid}>
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;

                      return (
                        <div
                          key={addr.id}
                          className={`${styles.addressCardZepto} ${
                            isSelected ? styles.addressCardActive : ''
                          }`}
                          onClick={() => handleSelectAddress(addr)}
                        >
                          <div className={styles.cardTopRow}>
                            <span
                              className={`${styles.tagBadge} ${
                                addr.tag === 'Home'
                                  ? styles.tagBadgeHome
                                  : addr.tag === 'Work'
                                  ? styles.tagBadgeWork
                                  : styles.tagBadgeOther
                              }`}
                            >
                              {addr.tag === 'Home' && <Home size={13} />}
                              {addr.tag === 'Work' && <Briefcase size={13} />}
                              {addr.tag === 'Other' && <MapPin size={13} />}
                              {addr.tag}
                            </span>

                            {isSelected && (
                              <span className={styles.selectedBadge}>
                                <Check size={13} /> Active Delivery
                              </span>
                            )}
                          </div>

                          <div className={styles.addressDetails}>
                            <div className={styles.personName}>
                              {addr.firstName} {addr.lastName}
                            </div>
                            <div className={styles.addressText}>
                              {addr.address1}
                              {addr.address2 && `, ${addr.address2}`}
                            </div>
                            <div className={styles.addressText}>
                              {addr.city}, {addr.state} - {addr.postcode}
                            </div>
                            {addr.phone && (
                              <div className={styles.phoneRow}>
                                <Phone size={13} /> {addr.phone}
                              </div>
                            )}
                          </div>

                          <div className={styles.cardBottomActions}>
                            {isSelected ? (
                              <span className={styles.selectedIndicator}>
                                <CheckCircle2 size={16} /> Delivering here
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={styles.selectAddressBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAddress(addr);
                                }}
                              >
                                Deliver Here
                              </button>
                            )}

                            <div className={styles.cardToolButtons}>
                              <button
                                type="button"
                                className={styles.actionIconBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditAddressModal(addr);
                                }}
                                title="Edit address"
                                aria-label="Edit address"
                              >
                                <Pencil size={13} />
                              </button>

                              {addresses.length > 1 && (
                                <button
                                  type="button"
                                  className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                                  onClick={(e) => handleDeleteAddress(addr.id, e)}
                                  title="Delete address"
                                  aria-label="Delete address"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Profile & Security Tab */}
            {activeTab === 'profile' && (
              <div className={styles.profileGrid}>
                {/* Personal Information */}
                <div className={styles.formCard}>
                  <div>
                    <h3 className={styles.formTitle}>Personal Information</h3>
                    <p className={styles.formDesc}>
                      Update your display name and contact phone number.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className={styles.form}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="profile-name">
                        Full Name
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        required
                        value={profileName || user.name}
                        onChange={(e) => setProfileName(e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="profile-email">
                        Email Address
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        disabled
                        value={user.email}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="profile-phone">
                        Phone Number
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className={styles.submitBtn}
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>

                {/* Password & Security */}
                <div className={styles.formCard}>
                  <div>
                    <h3 className={styles.formTitle}>Security & Password</h3>
                    <p className={styles.formDesc}>
                      Choose a strong password with at least 6 characters.
                    </p>
                  </div>

                  <form onSubmit={handleSavePassword} className={styles.form}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="new-pass">
                        New Password
                      </label>
                      <input
                        id="new-pass"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="confirm-pass">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-pass"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className={styles.submitBtn}
                    >
                      {isSavingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Mobile Sign Out Button */}
        <div className={styles.mobileSignOutWrap}>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.mobileSignOutBtn}
          >
            <LogOut size={16} /> Sign Out of Account
          </button>
        </div>
      </div>

      {/* Zepto/Swiggy Address Add/Edit Modal */}
      {showAddressModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddressModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className={styles.closeBtn}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className={styles.modalBody}>
              {/* Address Tag Selector (Home, Work, Other) */}
              <div className={styles.field}>
                <label className={styles.label}>Save Address As</label>
                <div className={styles.tagPickerRow}>
                  {(['Home', 'Work', 'Other'] as AddressTag[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.tagOptionBtn} ${
                        addressForm.tag === t ? styles.tagOptionActive : ''
                      }`}
                      onClick={() => setAddressForm((prev) => ({ ...prev, tag: t }))}
                    >
                      {t === 'Home' && <Home size={14} />}
                      {t === 'Work' && <Briefcase size={14} />}
                      {t === 'Other' && <MapPin size={14} />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.firstName}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Last Name</label>
                  <input
                    type="text"
                    value={addressForm.lastName}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>House / Flat / Block No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights, 4th Main"
                  value={addressForm.address1}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, address1: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Apartment / Area / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near HDFC Bank, Indiranagar"
                  value={addressForm.address2}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, address2: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 560001"
                    value={addressForm.postcode}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, postcode: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="For delivery rider calling"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="make-default-addr"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                  style={{ width: '16px', height: '16px', accentColor: '#111', cursor: 'pointer' }}
                />
                <label
                  htmlFor="make-default-addr"
                  style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}
                >
                  Set as default delivery address (Auto-select for orders)
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className={styles.cancelBtn}
                  disabled={isSavingAddress}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSavingAddress}
                >
                  {isSavingAddress ? 'Saving Address...' : 'Save & Select Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details & Tracking Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Order #{selectedOrder.id}</h3>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                  Placed on{' '}
                  {new Date(selectedOrder.date_created).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={styles.closeBtn}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Timeline */}
              {selectedOrder.status === 'cancelled' ? (
                <div className={styles.timeline}>
                  <div className={`${styles.step} ${styles.stepActive}`}>
                    <div className={styles.stepDot}>
                      <Check size={14} />
                    </div>
                    <span className={styles.stepLabel}>Placed</span>
                  </div>
                  <div className={`${styles.step} ${styles.stepActive}`}>
                    <div className={styles.stepDot} style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}>
                      <X size={14} strokeWidth={3} />
                    </div>
                    <span className={styles.stepLabel} style={{ color: '#dc2626', fontWeight: 800 }}>Cancelled</span>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepDot}>
                      <Clock size={14} />
                    </div>
                    <span className={styles.stepLabel}>Closed</span>
                  </div>
                </div>
              ) : (
                <div className={styles.timeline}>
                  <div className={`${styles.step} ${styles.stepActive}`}>
                    <div className={styles.stepDot}>
                      <Check size={14} />
                    </div>
                    <span className={styles.stepLabel}>Placed</span>
                  </div>
                  <div
                    className={`${styles.step} ${
                      ['processing', 'shipped', 'completed'].includes(selectedOrder.status)
                        ? styles.stepActive
                        : ''
                    }`}
                  >
                    <div className={styles.stepDot}>
                      <Clock size={14} />
                    </div>
                    <span className={styles.stepLabel}>Packed</span>
                  </div>
                  <div
                    className={`${styles.step} ${
                      ['shipped', 'completed'].includes(selectedOrder.status) ? styles.stepActive : ''
                    }`}
                  >
                    <div className={styles.stepDot}>
                      <Truck size={14} />
                    </div>
                    <span className={styles.stepLabel}>{selectedOrder.status === 'shipped' ? 'In Transit' : 'Delivered'}</span>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                  Items in this Order
                </h4>
                {selectedOrder.line_items.map((item) => (
                  <div key={item.id} className={styles.itemRow} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', background: '#f4f4f5', flexShrink: 0, border: '1px solid #e4e4e7' }}>
                        <Image
                          src={getItemImageUrl(item)}
                          alt={item.name}
                          fill
                          sizes="38px"
                          style={{ objectFit: 'cover' }}
                          unoptimized
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>
                        {item.quantity}× {item.name}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              {selectedOrder.shipping?.address_1 && (
                <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: '0.85rem' }}>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    Delivery Address
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.4 }}>
                    {selectedOrder.shipping.first_name} {selectedOrder.shipping.last_name}
                    <br />
                    {selectedOrder.shipping.address_1}
                    {selectedOrder.shipping.address_2 && `, ${selectedOrder.shipping.address_2}`}
                    <br />
                    {selectedOrder.shipping.city}, {selectedOrder.shipping.state} -{' '}
                    {selectedOrder.shipping.postcode}
                  </p>
                </div>
              )}

              {/* Total Breakdown */}
              <div
                style={{
                  borderTop: '1px solid #f4f4f5',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>
                    Payment Method
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {selectedOrder.payment_method_title || selectedOrder.payment_method || 'Cash on Delivery'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>
                    Grand Total
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111' }}>
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {['pending', 'processing', 'on-hold'].includes((selectedOrder.status || '').toLowerCase()) && (
                <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const orderToCancel = selectedOrder;
                      setSelectedOrder(null);
                      setCancellingOrder(orderToCancel);
                    }}
                    className={styles.cancelOrderBtn}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
                  >
                    <XCircle size={16} /> Cancel This Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Order Customer Confirmation Modal ── */}
      {cancellingOrder && (
        <div className={styles.cancelModalOverlay} onClick={() => !isCancelling && setCancellingOrder(null)}>
          <div className={styles.cancelModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cancelModalHeader}>
              <h3 className={styles.cancelModalTitle}>
                <XCircle size={20} color="#dc2626" /> Cancel Order #{cancellingOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={isCancelling}
                className={styles.closeBtn}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.cancelModalBody}>
              <div className={styles.cancelNoticeBox}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Are you sure you want to cancel this order?</strong>
                  <span>Once confirmed, this order will be immediately cancelled in our system and will not be dispatched.</span>
                </div>
              </div>

              <div className={styles.cancelReasonGroup}>
                <label htmlFor="cancel-reason" className={styles.cancelReasonLabel}>
                  Reason for cancellation
                </label>
                <select
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className={styles.cancelReasonSelect}
                  disabled={isCancelling}
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Need to change delivery address or contact info">Need to change delivery address or phone</option>
                  <option value="Need to change items or pack size">Need to change items or pack size</option>
                  <option value="Delivery time is too long">Delivery time is too long</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Want to change payment method">Want to change payment method</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div className={styles.cancelReasonGroup}>
                <label htmlFor="cancel-comments" className={styles.cancelReasonLabel}>
                  Additional feedback (optional)
                </label>
                <textarea
                  id="cancel-comments"
                  rows={2}
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                  placeholder="Help us understand why you are cancelling..."
                  className={styles.cancelCommentsInput}
                  disabled={isCancelling}
                />
              </div>
            </div>

            <div className={styles.cancelModalFooter}>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={isCancelling}
                className={styles.cancelKeepBtn}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className={styles.cancelConfirmBtn}
              >
                {isCancelling ? 'Cancelling Order...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
