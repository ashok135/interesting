'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle2, Send } from 'lucide-react';
import styles from '../terms/page.module.css';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', orderId: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>Contact Us</span>
      </nav>

      {/* Hero Header */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>CUSTOMER CONCIERGE & SUPPORT</span>
        <h1 className={styles.heroTitle}>We&apos;re Here to Help</h1>
        <p className={styles.heroDesc}>
          Have questions about your order, harvest origins, bulk corporate gifting, or feedback? Reach out to our dedicated support concierge.
        </p>
      </div>

      <div className={styles.tabContent}>
        {/* Support Channels Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className={styles.policyCard} style={{ margin: 0 }}>
            <div className={styles.cardHeader}>
              <Phone className={styles.cardIcon} size={22} color="#16a34a" />
              <div>
                <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>Phone & WhatsApp</h3>
                <span className={styles.lastUpdated}>Instant Chat Support</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p style={{ margin: 0 }}>
                <a href="tel:+919994847167" style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
                  +91 99948 47167
                </a>
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                Mon – Sat: 9:00 AM – 8:00 PM IST
              </p>
            </div>
          </div>

          <div className={styles.policyCard} style={{ margin: 0 }}>
            <div className={styles.cardHeader}>
              <Mail className={styles.cardIcon} size={22} color="#0284c7" />
              <div>
                <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>Email Support</h3>
                <span className={styles.lastUpdated}>Response within 4-6 hours</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p style={{ margin: 0 }}>
                <a href="mailto:support@intersting.duckdns.org" style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
                  support@intersting.duckdns.org
                </a>
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                For order inquiries, bulk pricing & cancellations
              </p>
            </div>
          </div>

          <div className={styles.policyCard} style={{ margin: 0 }}>
            <div className={styles.cardHeader}>
              <MapPin className={styles.cardIcon} size={22} color="#eab308" />
              <div>
                <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>Operating Location</h3>
                <span className={styles.lastUpdated}>Fulfillment Center</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.4 }}>
                <strong>INTERSTING Gourmet Pantry</strong><br />
                Tamil Nadu, India<br />
                PIN: 625512
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <MessageSquare className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Send us a Message</h2>
              <span className={styles.lastUpdated}>Grievance Officer & Support Form</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Message Received!
                </h3>
                <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                  Thank you for contacting us. A support representative will review your message and reach back to you via phone/email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Order ID (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. #108"
                      value={form.orderId}
                      onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>How can we help? *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your inquiry or order details..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '10px',
                    background: '#14532d',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    marginTop: '0.5rem',
                  }}
                >
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

