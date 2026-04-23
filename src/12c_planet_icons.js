/* =============================================================
 * PLANET ICONS — minimal stylized SVG art for each classical planet.
 * Used in the Dasha card to show the current Mahadasha lord.
 * Rahu and Ketu return null (shadow nodes, no body).
 * ============================================================= */

const PLANET_ICONS = {
  sun: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-sun" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="#fff5c8"/>
        <stop offset="45%" stop-color="#ffd166"/>
        <stop offset="100%" stop-color="#e68a2e"/>
      </radialGradient>
      <radialGradient id="pi-sun-glow" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stop-color="rgba(255,200,100,0)"/>
        <stop offset="100%" stop-color="rgba(255,170,60,0.35)"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#pi-sun-glow)"/>
    <circle cx="32" cy="32" r="20" fill="url(#pi-sun)"/>
    <circle cx="26" cy="26" r="5" fill="#fff7d6" opacity="0.45"/>
  </svg>`,

  moon: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-moon" cx="40%" cy="38%" r="60%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="55%" stop-color="#e0e8f5"/>
        <stop offset="100%" stop-color="#9aa5c2"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="22" fill="url(#pi-moon)"/>
    <circle cx="25" cy="27" r="2.5" fill="#b8c1d8" opacity="0.7"/>
    <circle cx="38" cy="33" r="1.8" fill="#b8c1d8" opacity="0.6"/>
    <circle cx="30" cy="40" r="2.1" fill="#b8c1d8" opacity="0.55"/>
    <circle cx="41" cy="24" r="1.3" fill="#b8c1d8" opacity="0.45"/>
  </svg>`,

  mars: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-mars" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="#ff9a6e"/>
        <stop offset="55%" stop-color="#d94a2a"/>
        <stop offset="100%" stop-color="#7a2414"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="22" fill="url(#pi-mars)"/>
    <ellipse cx="32" cy="13" rx="6" ry="2" fill="#f2d8c4" opacity="0.5"/>
    <ellipse cx="32" cy="51" rx="5" ry="1.8" fill="#f2d8c4" opacity="0.4"/>
    <ellipse cx="26" cy="34" rx="3" ry="2" fill="#8c2e1a" opacity="0.5"/>
  </svg>`,

  mercury: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-merc" cx="38%" cy="38%" r="65%">
        <stop offset="0%" stop-color="#d8d4c8"/>
        <stop offset="55%" stop-color="#8e867a"/>
        <stop offset="100%" stop-color="#3f3a32"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="20" fill="url(#pi-merc)"/>
    <circle cx="24" cy="26" r="2" fill="#2a2620" opacity="0.55"/>
    <circle cx="36" cy="34" r="1.5" fill="#2a2620" opacity="0.5"/>
    <circle cx="28" cy="38" r="1.2" fill="#2a2620" opacity="0.45"/>
    <circle cx="40" cy="25" r="1" fill="#2a2620" opacity="0.4"/>
  </svg>`,

  jupiter: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-jup" cx="38%" cy="38%" r="70%">
        <stop offset="0%" stop-color="#f5e3c2"/>
        <stop offset="50%" stop-color="#d7a96a"/>
        <stop offset="100%" stop-color="#7a4f28"/>
      </radialGradient>
      <clipPath id="pi-jup-clip"><circle cx="32" cy="32" r="24"/></clipPath>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#pi-jup)"/>
    <g clip-path="url(#pi-jup-clip)" opacity="0.5">
      <rect x="8" y="20" width="48" height="2.4" fill="#6d4620"/>
      <rect x="8" y="27" width="48" height="1.8" fill="#f5e8c8"/>
      <rect x="8" y="33" width="48" height="2.8" fill="#6d4620"/>
      <rect x="8" y="40" width="48" height="1.8" fill="#f5e8c8"/>
      <rect x="8" y="46" width="48" height="2" fill="#6d4620"/>
    </g>
    <ellipse cx="36" cy="36" rx="4" ry="2.2" fill="#a83a1a" opacity="0.75"/>
  </svg>`,

  venus: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-ven" cx="38%" cy="38%" r="70%">
        <stop offset="0%" stop-color="#fff4d0"/>
        <stop offset="50%" stop-color="#f0c874"/>
        <stop offset="100%" stop-color="#8a5a20"/>
      </radialGradient>
      <radialGradient id="pi-ven-glow" cx="50%" cy="50%" r="50%">
        <stop offset="65%" stop-color="rgba(255,230,160,0)"/>
        <stop offset="100%" stop-color="rgba(255,220,140,0.3)"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#pi-ven-glow)"/>
    <circle cx="32" cy="32" r="22" fill="url(#pi-ven)"/>
    <path d="M 14 28 Q 22 22, 32 24 Q 44 26, 50 30" stroke="#f5e0a5" stroke-width="1.2" fill="none" opacity="0.5"/>
    <path d="M 16 40 Q 26 36, 36 39 Q 46 42, 50 40" stroke="#f5e0a5" stroke-width="1" fill="none" opacity="0.4"/>
  </svg>`,

  saturn: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="pi-sat" cx="40%" cy="38%" r="65%">
        <stop offset="0%" stop-color="#f2d8a0"/>
        <stop offset="55%" stop-color="#c09758"/>
        <stop offset="100%" stop-color="#6b4a20"/>
      </radialGradient>
      <linearGradient id="pi-sat-ring" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#9a7a3a" stop-opacity="0.4"/>
        <stop offset="50%" stop-color="#e8cc85"/>
        <stop offset="100%" stop-color="#9a7a3a" stop-opacity="0.4"/>
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="33" rx="28" ry="7" fill="none" stroke="url(#pi-sat-ring)" stroke-width="2.8" opacity="0.85"/>
    <circle cx="32" cy="32" r="18" fill="url(#pi-sat)"/>
    <ellipse cx="32" cy="33" rx="28" ry="7" fill="none" stroke="url(#pi-sat-ring)" stroke-width="1.2" opacity="0.9"
             stroke-dasharray="45 8 40 120"/>
  </svg>`,

  rahu: null,
  ketu: null
};

function planetIconHTML(planetKey) {
  const key = planetKey.toLowerCase();
  const svg = PLANET_ICONS[key];
  if (!svg) {
    // Shadow node — render as an empty dashed circle to keep layout stable
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="22" fill="none" stroke="#3d4970" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.7"/>
    </svg>`;
  }
  return svg;
}
