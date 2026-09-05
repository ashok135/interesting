'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Truck,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Search,
  ChevronDown,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';
import styles from './page.module.css';

interface FAQ {
  id: string;
  category: 'shipping' | 'quality' | 'payments' | 'returns';
  question: string;
  answer: string;
}

const FAQS_DATA: FAQ[] = [
  // Shipping & Delivery
  {
    id: 's1',
    category: 'shipping',
    question: 'How long does delivery take across India?',
    answer: 'We dispatch all orders within 24 hours from our certified fulfillment center. Deliveries to metro cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata) arrive within 2–3 business days. Non-metro and regional locations typically take 3–5 business days.',
  },
  {
    id: 's2',
    category: 'shipping',
    question: 'Do you deliver to my PIN code?',
    answer: 'Yes! We deliver to over 19,000+ PIN codes across all Indian states and Union Territories via our tier-1 express air partners (Bluedart, Delhivery, and Xpressbees).',
  },
  {
    id: 's3',
    category: 'shipping',
    question: 'What are the delivery charges?',
    answer: 'We offer 100% FREE express shipping on all orders above ₹499. For smaller orders under ₹499, a nominal standard packaging & transit fee of ₹49 is applied at checkout.',
  },
  {
    id: 's4',
    category: 'shipping',
    question: 'How can I track my order?',
    answer: 'As soon as your package is dispatched, we send you an SMS and email notification with your live AWB tracking link. You can also track your orders anytime from your Interesting Account page.',
  },

  // Products & Quality
  {
    id: 'q1',
    category: 'quality',
    question: 'What does "W180" cashew grade mean?',
    answer: 'W180 denotes "White Whole 180" — globally recognized as the "King of Cashews". In international grading, 180 means there are less than 180 whole kernels per pound (approx. 453g). These are the largest, plumpest, and naturally creamiest cashews available on the market.',
  },
  {
    id: 'q2',
    category: 'quality',
    question: 'How are your nuts roasted and flavored?',
    answer: 'We avoid commercial deep-frying or palm oil. Our nuts are slow wood-fired and dry roasted in small artisanal batches with natural rock salt, crushed tellicherry black pepper, and real Kashmiri saffron. This preserves healthy unsaturated fats and produces an unbeatable crisp crunch.',
  },
  {
    id: 'q3',
    category: 'quality',
    question: 'How should I store dry fruits once opened?',
    answer: 'Our tins feature airtight inner pull-rings and reusable lid caps. Keep the tins in a cool, dry place away from direct sunlight. In humid weather or summer months, storing them in the refrigerator preserves maximum crunch and aroma for up to 9 months.',
  },
  {
    id: 'q4',
    category: 'quality',
    question: 'Are there any chemical preservatives or artificial colors?',
    answer: 'Zero! All our products are 100% natural, vegetarian, and free from synthetic preservatives, MSG, sulfur, or artificial coloring agents.',
  },

  // Payments & Billing
  {
    id: 'p1',
    category: 'payments',
    question: 'Is Cash on Delivery (COD) available?',
    answer: 'Yes, Cash on Delivery is available across most serviceable Indian PIN codes. You can pay cash directly to the courier executive upon receiving your package.',
  },
  {
    id: 'p2',
    category: 'payments',
    question: 'What online payment methods do you accept?',
    answer: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, BHIM, CRED), Credit/Debit cards (Visa, MasterCard, RuPay, Amex), NetBanking across 50+ banks, and popular wallets via 256-bit bank-grade encrypted payment gateways.',
  },
  {
    id: 'p3',
    category: 'payments',
    question: 'Can I get a GST tax invoice for business purchases?',
    answer: 'Yes. During checkout, enter your business GSTIN and Company Name in the billing details. A GST-compliant tax invoice will be automatically emailed to you alongside your order confirmation.',
  },

  // Returns & Refunds
  {
    id: 'r1',
    category: 'returns',
    question: 'What is your return & replacement policy?',
    answer: 'We maintain a 7-day hassle-free replacement guarantee. If your package arrives tampered with, damaged during transit, or fails our freshness standard, reach out via WhatsApp or email with a quick photo, and we will dispatch a brand-new replacement or process a full refund.',
  },
  {
    id: 'r2',
    category: 'returns',
    question: 'How long does it take to process a refund?',
    answer: 'Refunds for online payments are credited back to your original payment method (bank account / UPI / card) within 24 to 48 business hours after approval.',
  },
];

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'shipping' | 'quality' | 'payments' | 'returns'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ s1: true, q1: true });

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((item) => {
      const matchesTab = activeTab === 'all' || item.category === activeTab;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>Shipping & FAQs</span>
      </nav>

      {/* Header Banner */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>HELP & SUPPORT CENTER</span>
        <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
        <p className={styles.heroDesc}>
          Find quick answers about delivery timelines, nut grading, storage advice, and our quality guarantee.
        </p>

        {/* Search Bar */}
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search questions (e.g. W180, delivery, COD, returns)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsRow} role="tablist">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <HelpCircle size={15} />
          <span>All Questions</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'shipping' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          <Truck size={15} />
          <span>Shipping & Delivery</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'quality' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          <ShieldCheck size={15} />
          <span>Products & Quality</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'payments' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={15} />
          <span>Payments & COD</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'returns' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          <RotateCcw size={15} />
          <span>Returns & Refunds</span>
        </button>
      </div>

      {/* Accordion List */}
      <div className={styles.faqList}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = Boolean(openIds[faq.id]);
            return (
              <div key={faq.id} className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}>
                <button
                  type="button"
                  className={styles.questionBtn}
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.questionText}>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className={styles.answerContent}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={styles.noResults}>
            <p>No questions found matching &ldquo;{searchQuery}&rdquo;</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
            >
              Show all questions
            </button>
          </div>
        )}
      </div>

      {/* Still Have Questions? Contact Box */}
      <div className={styles.supportBox}>
        <div className={styles.supportLeft}>
          <h3 className={styles.supportTitle}>Still have questions or need assistance?</h3>
          <p className={styles.supportText}>
            Our gourmet concierge team is happy to help you with product queries, corporate bulk orders, or tracking.
          </p>
        </div>
        <div className={styles.supportRight}>
          <a href="tel:+919876543210" className={styles.supportBtnPrimary}>
            <Phone size={16} />
            <span>Call / WhatsApp</span>
          </a>
          <a href="mailto:support@interesting.com" className={styles.supportBtnSecondary}>
            <Mail size={16} />
            <span>Email Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}
