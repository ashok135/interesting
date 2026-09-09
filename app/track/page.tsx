'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Truck,
  Home,
  MapPin,
  CreditCard,
  ArrowRight,
  Search,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatters';
import type { WooOrder } from '@/types';
import styles from './page.module.css';

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id');

  const [orderIdInput, setOrderIdInput] = useState(idParam || '');
  const [order, setOrder] = useState<WooOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idParam) {
      setOrder(null);
      return;
    }

    setLoading(true);
    setError('');

    fetch(`/api/orders?id=${idParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.order) {
          throw new Error(data.error || 'Order not found. Please check your order number.');
        }
        setOrder(data.order);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unable to load order tracking.';
        setError(msg);
        setOrder(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [idParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderIdInput.trim();
    if (trimmed) {
      router.push(`/track?id=${encodeURIComponent(trimmed)}`);
    }
  };

  // Helper to determine step status
  const getStepState = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') {
      return { step: 4, progress: '100%' };
    }
    if (s === 'shipped' || s === 'in-transit') {
      return { step: 3, progress: '66%' };
    }
    if (s === 'processing') {
      return { step: 2, progress: '33%' };
    }
    return { step: 1, progress: '0%' };
  };

  const currentStatus = order?.status?.toLowerCase() || '';
  const { step: activeStepIndex, progress: progressWidth } = getStepState(currentStatus);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Track Your Order</h1>
        <p className={styles.subtitle}>
          Enter your Order ID from your SMS or receipt to get live shipping updates.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className={styles.searchBox}>
        <input
          type="text"
          placeholder="Enter Order ID (e.g. 85)"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          className={styles.searchInput}
          aria-label="Order ID"
        />
        <button type="submit" className={styles.searchBtn}>
          <Search size={16} /> Track
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div className={styles.statusState}>
          <div className={styles.spinner} />
          <p>Retrieving order details…</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className={styles.statusState}>
          <AlertCircle size={36} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h3>Order Not Found</h3>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{error}</p>
        </div>
      )}

      {/* Order Details View */}
      {!loading && order && (
        <div className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <div className={styles.orderMeta}>
              <span className={styles.orderNumber}>Order #{order.id}</span>
              <span className={styles.orderDate}>
                Placed on {new Date(order.date_created).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span
                className={`${styles.statusBadge} ${
                  order.status === 'completed'
                    ? styles.badgeCompleted
                    : order.status === 'cancelled'
                    ? styles.badgeCancelled
                    : styles.badgeProcessing
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Stepper tracker */}
          <div className={styles.stepperSection}>
            <div className={styles.stepper}>
              <div
                className={styles.stepperProgress}
                style={{ width: currentStatus === 'cancelled' ? '0%' : progressWidth }}
              />

              <div
                className={`${styles.stepNode} ${
                  activeStepIndex >= 1 ? styles.stepDone : ''
                } ${activeStepIndex === 1 ? styles.stepActive : ''}`}
              >
                <div className={styles.stepIconWrap}>
                  <CheckCircle2 size={18} />
                </div>
                <span className={styles.stepLabel}>Confirmed</span>
              </div>

              <div
                className={`${styles.stepNode} ${
                  activeStepIndex >= 2 ? styles.stepDone : ''
                } ${activeStepIndex === 2 ? styles.stepActive : ''}`}
              >
                <div className={styles.stepIconWrap}>
                  <Clock size={18} />
                </div>
                <span className={styles.stepLabel}>Processing</span>
              </div>

              <div
                className={`${styles.stepNode} ${
                  activeStepIndex >= 3 ? styles.stepDone : ''
                } ${activeStepIndex === 3 ? styles.stepActive : ''}`}
              >
                <div className={styles.stepIconWrap}>
                  <Truck size={18} />
                </div>
                <span className={styles.stepLabel}>Shipped</span>
              </div>

              <div
                className={`${styles.stepNode} ${
                  activeStepIndex >= 4 ? styles.stepDone : ''
                } ${activeStepIndex === 4 ? styles.stepActive : ''}`}
              >
                <div className={styles.stepIconWrap}>
                  <Home size={18} />
                </div>
                <span className={styles.stepLabel}>Delivered</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment details grid */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailBox}>
              <div className={styles.boxTitle}>
                <MapPin size={15} /> Delivery Address
              </div>
              <div className={styles.addressText}>
                <strong>
                  {order.billing?.first_name} {order.billing?.last_name}
                </strong>
                <br />
                {order.billing?.address_1}
                {order.billing?.address_2 ? `, ${order.billing.address_2}` : ''}
                <br />
                {order.billing?.city}, {order.billing?.state} - {order.billing?.postcode}
                <br />
                Phone: {order.billing?.phone || 'N/A'}
              </div>
            </div>

            <div className={styles.detailBox}>
              <div className={styles.boxTitle}>
                <CreditCard size={15} /> Payment &amp; Method
              </div>
              <div className={styles.addressText}>
                <strong>Payment:</strong> {order.payment_method_title || 'Cash on Delivery'}
                <br />
                <strong>Order Total:</strong> {formatPrice(parseFloat(order.total) || 0)}
                <br />
                <strong>Shipping:</strong> Express Delivery
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsSectionTitle}>Order Items</div>
            <div className={styles.itemList}>
              {(order.line_items || []).map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemQty}>Qty: {item.quantity}</div>
                  </div>
                  <div className={styles.itemPrice}>
                    {formatPrice(parseFloat(item.total) || 0)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryBox}>
              <span style={{ fontWeight: 600 }}>Total Paid / Due</span>
              <span className={styles.totalAmount}>
                {formatPrice(parseFloat(order.total) || 0)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actionRow}>
            <Link href="/shop" className={styles.btnPrimary}>
              Continue Shopping <ArrowRight size={15} />
            </Link>
            <Link href="/faq" className={styles.btnSecondary}>
              <HelpCircle size={15} /> Help &amp; Support
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <p>Loading tracking page…</p>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
