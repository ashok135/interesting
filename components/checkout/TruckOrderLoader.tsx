'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import styles from './TruckOrderLoader.module.css';

interface TruckOrderLoaderProps {
  isOpen: boolean;
  payMethod?: string;
  totalAmount?: string;
}

export default function TruckOrderLoader({
  isOpen,
  payMethod = 'cod',
  totalAmount,
}: TruckOrderLoaderProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStage(0);
      return;
    }

    const timer1 = setTimeout(() => setStage(1), 1200);
    const timer2 = setTimeout(() => setStage(2), 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stageTitles = [
    payMethod === 'razorpay'
      ? 'Connecting Payment Gateway…'
      : payMethod === 'upi'
      ? 'Verifying UPI Payment Reference…'
      : 'Securing Cash on Delivery Order…',
    'Assigning Express Delivery Vehicle…',
    'Finalizing Package & Dispatch Slot…',
  ];

  const stageSubtexts = [
    'Hand-sorting your farm-fresh nuts and luxury pantry selections…',
    'Routing express all-India courier dispatch with tamper-proof seal…',
    'Almost ready! Generating your official tax invoice and order summary…',
  ];

  const progressPercentages = [35, 70, 95];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Placing order">
      <div className={styles.modalCard}>
        <div className={styles.glowOrb} />

        {/* ── Express Delivery Truck Animation ── */}
        <div className={styles.stageWrap}>
          {/* Passing Scenery Trees */}
          <div className={styles.sceneryWrap}>
            <svg
              className={styles.sceneryTree}
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
            >
              <polygon points="12,2 22,20 16,20 20,30 4,30 8,20 2,20" fill="#15803d" opacity="0.45" />
              <rect x="10" y="30" width="4" height="6" fill="#78350f" opacity="0.5" />
            </svg>
            <svg
              className={styles.sceneryTreeAlt}
              width="20"
              height="30"
              viewBox="0 0 24 36"
              fill="none"
            >
              <polygon points="12,4 20,20 15,20 18,28 6,28 9,20 4,20" fill="#16a34a" opacity="0.35" />
              <rect x="10.5" y="28" width="3" height="5" fill="#78350f" opacity="0.4" />
            </svg>
          </div>

          {/* Detailed Vector Delivery Truck */}
          <div className={styles.truckWrap}>
            <svg
              width="170"
              height="88"
              viewBox="0 0 170 88"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Headlight beam */}
              <polygon
                points="160,52 170,44 170,62"
                fill="url(#headlightBeam)"
                opacity="0.6"
              />

              {/* Wind Speed Lines */}
              <line x1="6" y1="22" x2="26" y2="22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className={styles.windLine1} />
              <line x1="2" y1="34" x2="18" y2="34" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className={styles.windLine2} />

              {/* Exhaust Pipe & Smoke */}
              <rect x="14" y="58" width="8" height="4" rx="2" fill="#475569" />
              <circle cx="10" cy="59" r="3" fill="#cbd5e1" className={styles.smokePuff1} />
              <circle cx="6" cy="57" r="4.5" fill="#e2e8f0" className={styles.smokePuff2} />

              {/* Truck Cargo Box (Deep Forest Green) */}
              <rect x="22" y="16" width="94" height="46" rx="6" fill="#14532d" />
              <rect x="24" y="18" width="90" height="42" rx="4" fill="#166534" />

              {/* Gold Container Accent Stripe */}
              <line x1="24" y1="36" x2="114" y2="36" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="4 2" />

              {/* Container Text / Branding */}
              <text x="32" y="30" fill="#fef08a" fontSize="8" fontWeight="800" letterSpacing="0.08em">
                INTERESTING
              </text>
              <text x="32" y="47" fill="#86efac" fontSize="6.5" fontWeight="700">
                EXPRESS GOURMET
              </text>
              {/* Squirrel Mascot Stamp Silhouette */}
              <circle cx="100" cy="40" r="8" fill="#14532d" stroke="#facc15" strokeWidth="1" />
              <text x="97" y="43" fill="#facc15" fontSize="8">🐿️</text>

              {/* Cabin Connector / Chassis */}
              <rect x="112" y="44" width="10" height="18" fill="#334155" />

              {/* Driver Cabin (Emerald Green) */}
              <path
                d="M116 26 C116 26, 134 26, 140 33 L152 46 C155 49, 156 52, 156 56 L156 62 L116 62 Z"
                fill="#15803d"
              />
              <path
                d="M122 30 L136 30 L146 44 L122 44 Z"
                fill="#bae6fd"
                opacity="0.85"
              />
              {/* Steering wheel silhouette */}
              <circle cx="140" cy="42" r="2.5" fill="#334155" />

              {/* Front Bumper & Headlight */}
              <rect x="154" y="52" width="6" height="8" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
              <rect x="150" y="58" width="10" height="4" rx="2" fill="#64748b" />

              {/* Under-Chassis Bar */}
              <rect x="36" y="60" width="112" height="4" fill="#1e293b" />

              {/* Back Wheel Assembly */}
              <g className={styles.wheelBack} style={{ transformOrigin: '48px 64px' }}>
                <circle cx="48" cy="64" r="11" fill="#0f172a" />
                <circle cx="48" cy="64" r="7" fill="#cbd5e1" />
                <circle cx="48" cy="64" r="3" fill="#64748b" />
                <line x1="48" y1="57" x2="48" y2="71" stroke="#475569" strokeWidth="1.2" />
                <line x1="41" y1="64" x2="55" y2="64" stroke="#475569" strokeWidth="1.2" />
              </g>

              {/* Front Wheel Assembly */}
              <g className={styles.wheelFront} style={{ transformOrigin: '136px 64px' }}>
                <circle cx="136" cy="64" r="11" fill="#0f172a" />
                <circle cx="136" cy="64" r="7" fill="#cbd5e1" />
                <circle cx="136" cy="64" r="3" fill="#64748b" />
                <line x1="136" y1="57" x2="136" y2="71" stroke="#475569" strokeWidth="1.2" />
                <line x1="129" y1="64" x2="143" y2="64" stroke="#475569" strokeWidth="1.2" />
              </g>

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="headlightBeam" x1="156" y1="53" x2="170" y2="53" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fef08a" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#fef08a" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Moving Road */}
          <div className={styles.road}>
            <div className={styles.roadStripes} />
          </div>
        </div>

        {/* ── Status Text ── */}
        <h3 className={styles.headline}>{stageTitles[stage]}</h3>
        <p className={styles.subtext}>{stageSubtexts[stage]}</p>

        {/* ── Progress Track ── */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${progressPercentages[stage]}%` }}
          />
        </div>

        {/* ── Trust Badges ── */}
        <div className={styles.badgeRow}>
          <span className={styles.trustBadge}>
            <span className={styles.badgeDot} />
            {totalAmount ? `Total: ${totalAmount}` : 'Farm-Fresh Guaranteed'}
          </span>
          <span className={styles.trustBadge}>
            <ShieldCheck size={13} />
            100% Sealed Packaging
          </span>
          <span className={styles.trustBadge}>
            <Sparkles size={12} color="#f59e0b" />
            Express Dispatch
          </span>
        </div>
      </div>
    </div>
  );
}
