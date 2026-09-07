'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Heart,
  ShoppingBag,
  Package,
  MapPin,
  Shield,
  LogOut,
  LogIn,
  ChevronRight,
  Store,
  Sparkles,
  X,
  Download,
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useCartContext } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from '@/components/ui';
import styles from './Header.module.css';

export function Header() {
  const { itemCount, openDrawer, clearCart } = useCartContext();
  const { wishlistCount, clearWishlist } = useWishlist();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Dynamic cart values (zero fake counts)
  const displayItems = itemCount;

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          {/* Left: Brand Logo: INTERESTING */}
          <Link href="/" className={styles.brand} aria-label="Interesting Home">
            <div className={styles.monogram}>
              <span className={styles.monoText}>INT</span>
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>INTERESTING</span>
              <span className={styles.brandTagline}>GOURMET PANTRY</span>
            </div>
          </Link>

          {/* Search Bar (Desktop: full center; Mobile: small, neat search bar beside user icon) */}
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>

          {/* Right Actions */}
          <nav className={styles.actions} aria-label="Quick Actions">
            {/* Desktop Theme Toggle */}
            <div className={styles.desktopThemeToggle}>
              <ThemeToggle />
            </div>

            {/* Desktop Account Link */}
            {user ? (
              <Link href="/account" className={styles.desktopNavAction} aria-label="Account">
                <User size={18} strokeWidth={2.2} />
                <span className={styles.navActionLabel}>{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link href="/login" className={styles.desktopNavAction} aria-label="Account">
                <User size={18} strokeWidth={2.2} />
                <span className={styles.navActionLabel}>Account</span>
              </Link>
            )}

            {/* Desktop Wishlist (Hidden on mobile because mobile has bottom dock) */}
            <Link
              href="/wishlist"
              className={styles.desktopWishlistAction}
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart
                size={20}
                strokeWidth={2}
                fill={wishlistCount > 0 ? '#ef4444' : 'none'}
                color={wishlistCount > 0 ? '#ef4444' : 'currentColor'}
              />
              {wishlistCount > 0 && (
                <span className={styles.wishlistBadge}>{wishlistCount}</span>
              )}
            </Link>

            {/* Desktop Cart Button (Hidden on mobile because mobile has bottom dock) */}
            <button
              type="button"
              className={styles.desktopCartCapsule}
              onClick={openDrawer}
              aria-label={`Open cart, ${displayItems} items`}
            >
              <ShoppingBag size={18} strokeWidth={2.2} />
              <span className={styles.cartCountText}>{displayItems} ITEMS</span>
            </button>

            {/* Mobile Human Icon on the RIGHT side beside search */}
            <button
              type="button"
              className={styles.mobileUserBtn}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open profile & menu"
              aria-expanded={drawerOpen}
            >
              {user ? (
                <span className={styles.userAvatarInitial}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={19} strokeWidth={2.2} />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Slide-in Navigation & Profile Drawer */}
      {drawerOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        >
          <aside
            className={styles.drawer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Account & Navigation Menu"
          >
            {/* Drawer Header with user info */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerUserInfo}>
                <div className={styles.drawerAvatar}>
                  {user ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                </div>
                <div className={styles.drawerUserMeta}>
                  <p className={styles.drawerUserName}>
                    {user ? user.name : 'Welcome to Interesting!'}
                  </p>
                  <p className={styles.drawerUserSub}>
                    {user ? user.email : 'Log in for express checkout & saved addresses'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className={styles.drawerBody}>
              {/* Theme Toggle inside the Drawer as requested */}
              <div className={styles.drawerThemeBox}>
                <div className={styles.drawerThemeText}>
                  <span className={styles.drawerThemeTitle}>Display Theme</span>
                  <span className={styles.drawerThemeSub}>Switch light &amp; dark mode</span>
                </div>
                <ThemeToggle />
              </div>

              {/* Primary Shop Link */}
              <Link
                href="/shop"
                className={styles.drawerHighlightLink}
                onClick={() => setDrawerOpen(false)}
              >
                <div className={styles.drawerIconBox}>
                  <Store size={18} />
                </div>
                <div className={styles.drawerLinkContent}>
                  <span className={styles.drawerLinkTitle}>Explore All Products</span>
                  <span className={styles.drawerLinkSubtitle}>Direct orchard harvest</span>
                </div>
                <ChevronRight size={16} className={styles.drawerChevron} />
              </Link>

              {/* Account & Orders Section */}
              <div className={styles.drawerSection}>
                <p className={styles.drawerSectionLabel}>MY ACCOUNT &amp; ORDERS</p>
                <div className={styles.drawerList}>
                  <Link
                    href="/account"
                    className={styles.drawerListItem}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Package size={17} className={styles.drawerItemIcon} />
                    <span className={styles.drawerItemText}>My Orders</span>
                    <ChevronRight size={14} className={styles.drawerChevron} />
                  </Link>

                  <Link
                    href="/account"
                    className={styles.drawerListItem}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <MapPin size={17} className={styles.drawerItemIcon} />
                    <span className={styles.drawerItemText}>Delivery Addresses</span>
                    <ChevronRight size={14} className={styles.drawerChevron} />
                  </Link>

                  <Link
                    href="/wishlist"
                    className={styles.drawerListItem}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Heart size={17} className={styles.drawerItemIcon} />
                    <span className={styles.drawerItemText}>Saved Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className={styles.drawerBadge}>{wishlistCount}</span>
                    )}
                    <ChevronRight size={14} className={styles.drawerChevron} />
                  </Link>

                  <Link
                    href="/account"
                    className={styles.drawerListItem}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Shield size={17} className={styles.drawerItemIcon} />
                    <span className={styles.drawerItemText}>Profile &amp; Security</span>
                    <ChevronRight size={14} className={styles.drawerChevron} />
                  </Link>

                  <button
                    type="button"
                    className={styles.drawerListItem}
                    onClick={() => {
                      setDrawerOpen(false);
                      window.dispatchEvent(new CustomEvent('open-pwa-install'));
                    }}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                  >
                    <Download size={17} className={styles.drawerItemIcon} color="#f59e0b" />
                    <span className={styles.drawerItemText} style={{ fontWeight: 600, color: '#f59e0b' }}>Install / Download App</span>
                    <span className={styles.drawerBadge}>PWA</span>
                  </button>
                </div>
              </div>

              {/* Promo Banner */}
              <div className={styles.drawerPromoBox}>
                <Sparkles size={16} className={styles.sparkleIcon} />
                <div>
                  <p className={styles.promoCodeText}>USE CODE: <strong>KAJU100</strong></p>
                  <p className={styles.promoSubText}>Flat ₹100 OFF on your first royal order</p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className={styles.drawerFooter}>
              {user ? (
                <button
                  type="button"
                  className={styles.drawerLogoutBtn}
                  onClick={() => {
                    setDrawerOpen(false);
                    clearCart();
                    clearWishlist();
                    logout();
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className={styles.drawerLoginBtn}
                  onClick={() => setDrawerOpen(false)}
                >
                  <LogIn size={16} /> Log In / Sign Up
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
