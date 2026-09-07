'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Share,
  PlusSquare,
  Smartphone,
} from 'lucide-react';
import styles from './PwaInstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed / standalone
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      return Boolean(isStandalone);
    };

    if (checkStandalone()) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Check dismissal cooldown (24 hours)
    const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
    const isCoolingDown = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

    // 5. Handle standard Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isCoolingDown) {
        // Show after a brief comfortable delay
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 6. Handle app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 7. For iOS: If not dismissed, prompt user to add to home screen
    if (isIosDevice && !isCoolingDown && !checkStandalone()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 8. Listen for manual trigger from header/footer
    const handleManualOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-pwa-install', handleManualOpen);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback instruction if browser blocked automated prompt
      alert('To install, tap your browser menu (⋮) and choose "Add to Home screen" or "Install App".');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error during install prompt:', err);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setShowIOSGuide(false);
    // Dismiss for 24 hours
    const nextPrompt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_prompt_dismissed_until', nextPrompt.toString());
  };

  if (!isOpen || isInstalled) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Install App">
      <div className={styles.card}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleDismiss}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={styles.headerRow}>
          <Image
            src="/icon-192.png"
            alt="Interesting Gourmet App Icon"
            width={54}
            height={54}
            className={styles.appIcon}
            priority
          />
          <div className={styles.appInfo}>
            <div className={styles.badgeRow}>
              <span className={styles.verifiedBadge}>Verified PWA</span>
              <span className={styles.rating}>★ 4.9 (10k+ users)</span>
            </div>
            <h3 className={styles.appTitle}>Interesting Gourmet App</h3>
            <p className={styles.appTagline}>Express 15–30 Mins Quick Delivery</p>
          </div>
        </div>

        <div className={styles.benefitsList}>
          <div className={styles.benefitItem}>
            <Zap size={15} className={styles.benefitIcon} />
            <span>2x Faster Shopping & 1-Tap Quick Checkout</span>
          </div>
          <div className={styles.benefitItem}>
            <Sparkles size={15} className={styles.benefitIcon} />
            <span>Real-time Live Order Tracking & Notifications</span>
          </div>
          <div className={styles.benefitItem}>
            <CheckCircle2 size={15} className={styles.benefitIcon} />
            <span>Works offline with zero app store downloads</span>
          </div>
        </div>

        {showIOSGuide ? (
          <div className={styles.iosGuide}>
            <div className={styles.iosGuideTitle}>
              <Smartphone size={16} /> How to Install on iPhone / iPad:
            </div>
            <div className={styles.iosStep}>
              <span className={styles.stepNum}>1</span>
              <span>
                Tap the <strong>Share</strong> button <Share size={14} className={styles.inlineIcon} /> at the bottom of Safari.
              </span>
            </div>
            <div className={styles.iosStep}>
              <span className={styles.stepNum}>2</span>
              <span>
                Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare size={14} className={styles.inlineIcon} />.
              </span>
            </div>
            <div className={styles.iosStep}>
              <span className={styles.stepNum}>3</span>
              <span>
                Tap <strong>Add</strong> in the top-right corner to finish.
              </span>
            </div>
          </div>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.installBtn}
            onClick={handleInstallClick}
          >
            <Download size={18} strokeWidth={2.4} />
            {isIOS && !showIOSGuide ? 'Add to Home Screen' : 'Install / Download App'}
          </button>
          <button
            type="button"
            className={styles.laterBtn}
            onClick={handleDismiss}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
