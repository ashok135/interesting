import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'horizontal' | 'mark-only';
  className?: string;
}

export function BrandLogo({ size = 36, variant = 'horizontal', className }: LogoProps) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
      }}
    >
      {/* Premium Emblem SVG Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="brandEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#047857" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="50" cy="50" r="48" fill="url(#glow)" />

        {/* Outer Hexagon / Shield Badge */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="22"
          fill="url(#brandEmerald)"
          stroke="url(#brandGold)"
          strokeWidth="3"
        />

        {/* Inner Geometric Border */}
        <rect
          x="14"
          y="14"
          width="72"
          height="72"
          rx="16"
          fill="none"
          stroke="#10b981"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Botanical Harvest Leaf & Star Iconography */}
        {/* Stylized Modern Cashew / Sprout Leaf Silhouette */}
        <path
          d="M50 24C38 34 33 46 38 60C41 68 47 74 54 74C65 74 72 65 72 52C72 38 62 26 50 24Z"
          fill="url(#brandGold)"
          fillOpacity="0.95"
        />

        {/* Inner Leaf Vein Cutout */}
        <path
          d="M48 32C42 42 42 54 48 64C54 56 58 46 56 36C54 34 50 32 48 32Z"
          fill="#064e3b"
        />

        {/* Diamond / Star Peak Accent */}
        <path
          d="M50 18L52.5 22L50 26L47.5 22Z"
          fill="url(#brandGold)"
        />
        <circle cx="28" cy="70" r="2.5" fill="url(#brandGold)" />
        <circle cx="72" cy="70" r="2.5" fill="url(#brandGold)" />
      </svg>

      {/* Brand Typographic Identity */}
      {variant === 'horizontal' && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-royal, Georgia, serif)',
              fontSize: '1.2rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: 'var(--color-brand-title, #0f2d1d)',
              textTransform: 'uppercase',
            }}
          >
            INTERSTING
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: 'var(--color-brand-green, #15803d)',
              textTransform: 'uppercase',
              marginTop: '0.2rem',
            }}
          >
            FARM-FRESH PANTRY
          </span>
        </div>
      )}
    </div>
  );
}
