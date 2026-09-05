'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setMessage(res.message || 'Password reset instructions have been generated.');
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
      }
    } else {
      setError(res.error || 'Failed to process request');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your email to receive password reset instructions for your account</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        {message ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={40} color="#16a34a" />
            </div>
            <p className={styles.successText}>{message}</p>
            {resetUrl && (
              <a
                href={resetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resetBtn}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Set New Password <ArrowRight size={16} />
              </a>
            )}
            <Link href="/login" className={styles.backLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Submitting...' : 'Send Reset Link'}
            </button>

            <div className={styles.footer}>
              <Link href="/login" className={styles.backLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
