'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import styles from './PwaInstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed
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

    // 5. Chromium beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isCoolingDown) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 6. App installed handler
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 7. iOS prompt if not dismissed
    if (isIosDevice && !isCoolingDown && !checkStandalone()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // 8. Manual trigger listener
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
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) {
      alert('To install, tap your browser menu (⋮) and choose "Add to Home screen" or "Install App".');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Install error:', err);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setShowIOSTip(false);
    // Remember dismissal for 24 hours
    const nextPrompt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_prompt_dismissed_until', nextPrompt.toString());
  };

  if (!isOpen || isInstalled) {
    return null;
  }

  return (
    <aside className={styles.bannerContainer} aria-label="Install App Banner">
      <div className={styles.card}>
        <div className={styles.mainRow}>
          <Image
            src="/icon-192.png"
            alt="Interesting App"
            width={44}
            height={44}
            className={styles.appIcon}
            priority
          />

          <div className={styles.textGroup}>
            <p className={styles.title}>Interesting App</p>
            <p className={styles.subtitle}>Install for faster shopping &amp; tracking</p>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.installBtn}
              onClick={handleInstallClick}
              aria-label="Install App"
            >
              <Download size={14} strokeWidth={2.5} />
              Install
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleDismiss}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {showIOSTip && (
          <div className={styles.iosTip}>
            Tap <Share size={13} className={styles.inlineIcon} /> Share, then tap{' '}
            <strong>Add to Home Screen</strong> <PlusSquare size={13} className={styles.inlineIcon} />.
          </div>
        )}
      </div>
    </aside>
  );
}
