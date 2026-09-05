import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>I</span>
            <span className={styles.logoName}>INTERSTING</span>
          </div>
          <p className={styles.tagline}>
            Premium nuts & dry fruits delivered fresh from the source.
            100% zero adulteration, GI certified.
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Shop</h4>
            <Link href="/shop" className={styles.link}>All Products</Link>
            <Link href="/shop?category=cashews" className={styles.link}>Cashews</Link>
            <Link href="/shop?category=almonds" className={styles.link}>Almonds</Link>
            <Link href="/shop?category=walnuts" className={styles.link}>Walnuts</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Support</h4>
            <Link href="/about" className={styles.link}>About Us</Link>
            <Link href="/contact" className={styles.link}>Contact</Link>
            <Link href="/faq" className={styles.link}>FAQ</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Legal</h4>
            <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
            <Link href="/terms" className={styles.link}>Terms & Conditions</Link>
            <Link href="/returns" className={styles.link}>Return Policy</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} INTERSTING. All rights reserved.</p>
      </div>
    </footer>
  );
}
