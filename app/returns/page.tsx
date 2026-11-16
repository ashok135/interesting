'use client';

import Link from 'next/link';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Camera,
  MessageCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import returnsData from '@/content/policies/returns.json';
import styles from './page.module.css';

export default function ReturnsPage() {
  const getPillarIcon = (icon: string) => {
    switch (icon) {
      case 'rotate':
        return <RotateCcw size={22} />;
      case 'clock':
        return <Clock size={22} />;
      case 'check':
      default:
        return <CheckCircle2 size={22} />;
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <Camera size={24} />;
      case 2:
        return <MessageCircle size={24} />;
      case 3:
      default:
        return <Truck size={24} />;
    }
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>{returnsData.title}</span>
      </nav>

      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>{returnsData.heroTag}</span>
        <h1 className={styles.heroTitle}>{returnsData.title}</h1>
        <p className={styles.heroDesc}>{returnsData.heroDesc}</p>
      </div>

      {/* 3 Pillars */}
      <div className={styles.pillarsGrid}>
        {returnsData.pillars.map((pillar, idx) => (
          <div key={idx} className={styles.pillarCard}>
            <div className={styles.pillarIcon}>{getPillarIcon(pillar.icon)}</div>
            <h3 className={styles.pillarTitle}>{pillar.title}</h3>
            <p className={styles.pillarText}>{pillar.text}</p>
          </div>
        ))}
      </div>

      {/* Step by Step Process */}
      <div className={styles.processSection}>
        <h2 className={styles.sectionHeading}>How To Request a Replacement or Refund</h2>
        <p className={styles.sectionSub}>Follow these 3 easy steps to resolve your issue quickly:</p>

        <div className={styles.stepsGrid}>
          {returnsData.steps.map((step) => (
            <div key={step.step} className={styles.stepCard}>
              <div className={styles.stepBadge}>{step.step}</div>
              <div className={styles.stepIconWrap}>{getStepIcon(step.step)}</div>
              <h4 className={styles.stepTitle}>{step.title}</h4>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligible vs Non-Eligible */}
      <div className={styles.guidelinesSection}>
        <div className={styles.guideCard}>
          <h3 className={styles.guideTitleGood}>
            <CheckCircle2 size={18} /> Eligible for Replacement & Refund
          </h3>
          <ul className={styles.guideList}>
            {returnsData.eligible.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.guideCard}>
          <h3 className={styles.guideTitleBad}>
            <ShieldAlert size={18} /> Non-Eligible Scenarios
          </h3>
          <ul className={styles.guideList}>
            {returnsData.nonEligible.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Support Banner */}
      <div className={styles.supportBox}>
        <div className={styles.supportLeft}>
          <h3 className={styles.supportTitle}>Need Help With an Existing Order?</h3>
          <p className={styles.supportText}>
            Our team is active {returnsData.support.hours}. We are dedicated to providing you the best gourmet shopping experience.
          </p>
        </div>
        <div className={styles.supportRight}>
          <a
            href={returnsData.support.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.supportBtnPrimary}
          >
            <MessageCircle size={16} />
            <span>Chat on WhatsApp</span>
          </a>
          <Link href="/account" className={styles.supportBtnSecondary}>
            <span>View My Orders</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
