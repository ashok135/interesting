/**
 * Ultra-Smooth macOS Genie / Parabolic Fly-to-Cart Animation
 * Generates an Apple-grade fluid arc minimizing the product into the bottom cart dock.
 */
export function flyToCart(
  source: HTMLElement | React.MouseEvent | { x: number; y: number },
  imageSrc?: string
) {
  if (typeof window === 'undefined') return;

  // 1. Determine origin coordinates
  let startX = 0;
  let startY = 0;
  const startSize = 48;

  if (source && 'currentTarget' in source) {
    const el = source.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    startX = rect.left + rect.width / 2 - startSize / 2;
    startY = rect.top + rect.height / 2 - startSize / 2;
  } else if (source instanceof HTMLElement) {
    const rect = source.getBoundingClientRect();
    startX = rect.left + rect.width / 2 - startSize / 2;
    startY = rect.top + rect.height / 2 - startSize / 2;
  } else if (source && typeof source === 'object' && 'x' in source && 'y' in source) {
    startX = source.x - startSize / 2;
    startY = source.y - startSize / 2;
  } else {
    startX = window.innerWidth / 2 - startSize / 2;
    startY = window.innerHeight / 2 - startSize / 2;
  }

  // 2. Find destination target (Floating Cart Bar at the bottom center)
  const isMobile = window.innerWidth <= 768;
  const bottomCartBar = document.getElementById('floating-cart-bar');

  // Always target bottom center where the FloatingCartBar docks
  let targetX = window.innerWidth / 2;
  let targetY = isMobile ? window.innerHeight - 95 : window.innerHeight - 45;

  if (bottomCartBar) {
    const rect = bottomCartBar.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }
  }

  // 3. Create the floating thumbnail orb
  const flyer = document.createElement('div');
  flyer.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: ${startSize}px;
    height: ${startSize}px;
    border-radius: 50%;
    z-index: 999999;
    pointer-events: none;
    overflow: hidden;
    background-color: #ffffff;
    border: 2px solid #ffffff;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25), 0 0 12px rgba(34, 197, 94, 0.4);
    will-change: transform, opacity;
  `;

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Added product';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;';
    flyer.appendChild(img);
  } else {
    flyer.style.backgroundColor = '#14532d';
  }

  document.body.appendChild(flyer);

  // 4. Calculate relative deltas
  const deltaX = targetX - (startX + startSize / 2);
  const deltaY = targetY - (startY + startSize / 2);

  // Parabolic upward toss apex (creates the genie minimize arc)
  const arcPeak = Math.max(32, Math.min(75, Math.abs(deltaY) * 0.2));

  // 5. Generate continuous mathematical trajectory (10 fine steps)
  const keyframes: Keyframe[] = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Fluid ease: begins smooth, arcs upward, accelerates into the bottom cart
    const easeT = Math.pow(t, 1.25);
    const curX = deltaX * Math.pow(t, 1.3);
    const curY = deltaY * easeT - Math.sin(Math.PI * Math.pow(t, 0.72)) * arcPeak;
    const curScale = 1 - 0.88 * Math.pow(t, 1.25);
    const curOpacity = t > 0.88 ? Math.max(0, 1 - (t - 0.88) / 0.12) : 1;

    keyframes.push({
      transform: `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) scale(${curScale.toFixed(3)})`,
      opacity: Number(curOpacity.toFixed(2)),
    });
  }

  // 6. Smooth, comfortable, professional duration: 560ms (user requested a little slower)
  const animation = flyer.animate(keyframes, {
    duration: 560,
    easing: 'cubic-bezier(0.25, 0.85, 0.35, 1)',
    fill: 'forwards',
  });

  // 7. On impact: cleanup & play snappy spring dock bounce
  animation.onfinish = () => {
    flyer.remove();

    if (bottomCartBar) {
      bottomCartBar.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.15)', offset: 0.35 },
          { transform: 'scale(0.96)', offset: 0.7 },
          { transform: 'scale(1)' },
        ],
        {
          duration: 280,
          easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)',
        }
      );
    }
  };
}
