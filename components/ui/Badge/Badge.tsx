import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({ children, variant = 'accent' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
