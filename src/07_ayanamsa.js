/* =============================================================
 * AYANAMSA — difference between tropical and sidereal zodiac.
 * Uses IAU 1976 precession model + epoch anchor values at J2000.
 * ============================================================= */

// Precession in longitude since J2000, in degrees. (IAU 1976 / Lieske 1977)
function precessionFromJ2000Deg(jde) {
  const T = (jde - J2000) / 36525;
  const arcsec = 5028.796195 * T + 1.1054348 * T*T + 0.00007964 * T*T*T;
  return arcsec / 3600;
}

// Anchor values at J2000 (tropical minus sidereal):
// Lahiri (Chitrapaksha, official Indian IAE): 23° 51' 12.44" = 23.85345556°
// Pushya Paksha: 23° 15' 00" = 23.25° (Pushyami nakshatra midpoint anchor)
const AYANAMSA_ANCHOR_J2000 = {
  lahiri: 23.85345556,
  pushya: 23.25
};

function ayanamsa(jde, kind) {
  const anchor = AYANAMSA_ANCHOR_J2000[kind] ?? AYANAMSA_ANCHOR_J2000.lahiri;
  return anchor + precessionFromJ2000Deg(jde);
}

// Convert a tropical ecliptic longitude (radians) to sidereal (radians)
function tropicalToSidereal(lonRad, jde, kind) {
  const ay = ayanamsa(jde, kind) * DEG;
  return mod2pi(lonRad - ay);
}
