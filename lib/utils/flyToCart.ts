/**
 * macOS Genie Effect / Fly-to-Cart Animation
 * Curves and shrinks the added product thumbnail into the bottom floating cart / bag icon.
 */
export function flyToCart(
  source: HTMLElement | React.MouseEvent | { x: number; y: number },
  imageSrc?: string
) {
  if (typeof window === 'undefined') return;

  // 1. Determine origin coordinates
  let startX = 0;
  let startY = 0;
  const startSize = 54;

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

  // 2. Find destination target (Prioritizes bottom cart bar / mobile capsule bag, then desktop header)
  const isMobile = window.innerWidth <= 768;
  const bottomCartBar = document.getElementById('floating-cart-bar');
  const bottomCapsuleBag = document.getElementById('mobile-capsule-bag');
  const headerCartBtn = document.getElementById('header-cart-btn');

  const destElement = bottomCartBar || bottomCapsuleBag || (!isMobile ? headerCartBtn : null);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight - 50;

  if (destElement) {
    const rect = destElement.getBoundingClientRect();
    targetX = rect.left + rect.width / 2;
    targetY = rect.top + rect.height / 2;
  } else if (headerCartBtn && !isMobile) {
    const rect = headerCartBtn.getBoundingClientRect();
    targetX = rect.left + rect.width / 2;
    targetY = rect.top + rect.height / 2;
  }

  // 3. Create the floating thumbnail element
  const flyer = document.createElement('div');
  flyer.className = 'genie-fly-particle';
  flyer.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: ${startSize}px;
    height: ${startSize}px;
    border-radius: 50%;
    z-index: 999999;
    pointer-events: none;
    box-shadow: 0 10px 28px rgba(20, 83, 45, 0.45), 0 0 16px rgba(245, 158, 11, 0.4);
    border: 2.5px solid #22c55e;
    background-color: #ffffff;
    ${imageSrc ? `background-image: url("${imageSrc}");` : 'background-color: #14532d;'}
    background-size: cover;
    background-position: center;
    will-change: transform, opacity;
  `;

  document.body.appendChild(flyer);

  // 4. Calculate 2D delta & macOS Genie curved trajectory
  const deltaX = targetX - (startX + startSize / 2);
  const deltaY = targetY - (startY + startSize / 2);

  // An upward arc peak to mimic the genie lamp / dock minimization curve
  const arcHeight = Math.min(-45, deltaY * 0.18);

  const animation = flyer.animate(
    [
      {
        transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
        opacity: 1,
        filter: 'brightness(1)',
      },
      {
        transform: `translate(${deltaX * 0.3}px, ${deltaY * 0.2 + arcHeight}px) scale(0.92) rotate(-10deg)`,
        opacity: 0.98,
        offset: 0.3,
      },
      {
        transform: `translate(${deltaX * 0.72}px, ${deltaY * 0.65}px) scale(0.58) rotate(14deg)`,
        opacity: 0.9,
        offset: 0.72,
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(0.12) rotate(0deg)`,
        opacity: 0,
        filter: 'brightness(1.6)',
      },
    ],
    {
      duration: 650,
      easing: 'cubic-bezier(0.2, 0.85, 0.3, 1.15)',
      fill: 'forwards',
    }
  );

  // 5. Trigger spring impact bounce on the destination cart button
  animation.onfinish = () => {
    flyer.remove();

    const targetToBounce = destElement || bottomCartBar || bottomCapsuleBag || headerCartBtn;
    if (targetToBounce) {
      targetToBounce.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.22)', offset: 0.35 },
          { transform: 'scale(0.92)', offset: 0.7 },
          { transform: 'scale(1)' },
        ],
        {
          duration: 380,
          easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }
      );
    }
  };
}
