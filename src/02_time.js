/* =============================================================
 * TIME & CALENDAR UTILITIES
 * ============================================================= */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const J2000 = 2451545.0;
const TWO_PI = 2 * Math.PI;

function mod360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
function mod2pi(x) { x = x % TWO_PI; return x < 0 ? x + TWO_PI : x; }

// Julian Day from Gregorian/Julian calendar date.
// Automatically uses Julian calendar before 1582-10-15, Gregorian after.
function julianDay(year, month, day, hour = 0, minute = 0, second = 0) {
  const frac = (hour + minute/60 + second/3600) / 24;
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  // Gregorian reform: 1582-10-15 onwards
  const isGregorian = (year > 1582) ||
    (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  let B = 0;
  if (isGregorian) {
    const A = Math.floor(y / 100);
    B = 2 - A + Math.floor(A / 4);
  }
  const jd = Math.floor(365.25 * (y + 4716))
    + Math.floor(30.6001 * (m + 1))
    + day + B - 1524.5 + frac;
  return jd;
}

// Inverse: Julian Day -> {year, month, day, hour, minute, second}
function julianDayToDate(jd) {
  const j = jd + 0.5;
  const Z = Math.floor(j);
  const F = j - Z;
  let A;
  if (Z < 2299161) { A = Z; }
  else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const dayInt = Math.floor(day);
  let hr = (day - dayInt) * 24;
  const hour = Math.floor(hr);
  let mn = (hr - hour) * 60;
  const minute = Math.floor(mn);
  const second = (mn - minute) * 60;
  return { year, month, day: dayInt, hour, minute, second };
}

// Delta T (TT - UT1), in seconds.
// Uses Espenak & Meeus 2006 piecewise polynomial covering -1999 to +3000.
function deltaT(year, month = 1) {
  const y = year + (month - 0.5) / 12;
  let dt;
  if (y < -500) {
    const u = (y - 1820) / 100;
    dt = -20 + 32 * u * u;
  } else if (y < 500) {
    const u = y / 100;
    dt = 10583.6 + u*(-1014.41 + u*(33.78311 + u*(-5.952053 + u*(-0.1798452 + u*(0.022174192 + u*0.0090316521)))));
  } else if (y < 1600) {
    const u = (y - 1000) / 100;
    dt = 1574.2 + u*(-556.01 + u*(71.23472 + u*(0.319781 + u*(-0.8503463 + u*(-0.005050998 + u*0.0083572073)))));
  } else if (y < 1700) {
    const u = y - 1600;
    dt = 120 + u*(-0.9808 + u*(-0.01532 + u/7129));
  } else if (y < 1800) {
    const u = y - 1700;
    dt = 8.83 + u*(0.1603 + u*(-0.0059285 + u*(0.00013336 - u/1174000)));
  } else if (y < 1860) {
    const u = y - 1800;
    dt = 13.72 + u*(-0.332447 + u*(0.0068612 + u*(0.0041116 + u*(-0.00037436 + u*(0.0000121272 + u*(-0.0000001699 + u*0.000000000875))))));
  } else if (y < 1900) {
    const u = y - 1860;
    dt = 7.62 + u*(0.5737 + u*(-0.251754 + u*(0.01680668 + u*(-0.0004473624 + u/233174))));
  } else if (y < 1920) {
    const u = y - 1900;
    dt = -2.79 + u*(1.494119 + u*(-0.0598939 + u*(0.0061966 - u*0.000197)));
  } else if (y < 1941) {
    const u = y - 1920;
    dt = 21.20 + u*(0.84493 + u*(-0.076100 + u*0.0020936));
  } else if (y < 1961) {
    const u = y - 1950;
    dt = 29.07 + u*(0.407 + u*(-1/233 + u/2547));
  } else if (y < 1986) {
    const u = y - 1975;
    dt = 45.45 + u*(1.067 + u*(-1/260 - u/718));
  } else if (y < 2005) {
    const u = y - 2000;
    dt = 63.86 + u*(0.3345 + u*(-0.060374 + u*(0.0017275 + u*(0.000651814 + u*0.00002373599))));
  } else if (y < 2050) {
    const u = y - 2000;
    dt = 62.92 + u*(0.32217 + u*0.005589);
  } else if (y < 2150) {
    dt = -20 + 32 * Math.pow((y - 1820) / 100, 2) - 0.5628 * (2150 - y);
  } else {
    const u = (y - 1820) / 100;
    dt = -20 + 32 * u * u;
  }
  return dt;
}

// Julian Ephemeris Day: JD + deltaT/86400
function jdToJDE(jd, year, month) {
  return jd + deltaT(year, month) / 86400;
}

// Mean obliquity of ecliptic (IAU 2006), in radians. T is Julian centuries from J2000 (TT).
function meanObliquity(T) {
  // Laskar's formula, valid over ±10000 years (from Meeus)
  const U = T / 100;
  const eps0Arcsec = 84381.448
    - 4680.93 * U
    - 1.55 * U*U
    + 1999.25 * U*U*U
    - 51.38 * U**4
    - 249.67 * U**5
    - 39.05 * U**6
    + 7.12 * U**7
    + 27.87 * U**8
    + 5.79 * U**9
    + 2.45 * U**10;
  return eps0Arcsec / 3600 * DEG;
}

// Simple nutation (Meeus ch 22, lower accuracy — sufficient for astrology).
// Returns { dPsi, dEps } in radians.
function nutation(T) {
  const Om = (125.04452 - 1934.136261 * T) * DEG;
  const L  = (280.4665 + 36000.7698 * T) * DEG;
  const Lm = (218.3165 + 481267.8813 * T) * DEG;
  const dPsiArcsec = -17.20 * Math.sin(Om)
                   -  1.32 * Math.sin(2*L)
                   -  0.23 * Math.sin(2*Lm)
                   +  0.21 * Math.sin(2*Om);
  const dEpsArcsec =   9.20 * Math.cos(Om)
                   +  0.57 * Math.cos(2*L)
                   +  0.10 * Math.cos(2*Lm)
                   -  0.09 * Math.cos(2*Om);
  return {
    dPsi: dPsiArcsec / 3600 * DEG,
    dEps: dEpsArcsec / 3600 * DEG
  };
}

// Mean sidereal time at Greenwich (Meeus 12.4), in degrees 0..360
function meanSiderealTimeDeg(jd) {
  const T = (jd - J2000) / 36525;
  let theta = 280.46061837
    + 360.98564736629 * (jd - J2000)
    + T*T * 0.000387933
    - T*T*T / 38710000;
  return mod360(theta);
}

// Apparent sidereal time (includes nutation in RA)
function apparentSiderealTimeDeg(jd, T) {
  const gmst = meanSiderealTimeDeg(jd);
  const { dPsi } = nutation(T);
  const eps = meanObliquity(T);
  const eqEquinox = dPsi * Math.cos(eps) * RAD; // degrees
  return mod360(gmst + eqEquinox);
}

// Convert local civil time to UT Julian Day. tzHours: offset from UTC in hours (east +)
function localToJD(year, month, day, hour, minute, second, tzHours) {
  // Local - tzOffset = UT
  let h = hour - tzHours;
  return julianDay(year, month, day, h, minute, second);
}
