/* =============================================================
 * HOUSE SYSTEMS — Placidus, Koch, Whole Sign.
 * All return an array of 12 cusp longitudes in radians (tropical).
 * Inputs: jd (UT), lat (rad), lon (rad, east+), obliquity eps (rad)
 * ============================================================= */

// Ramc (right ascension of MC) in radians
function ramcRad(jd, lonRad) {
  const gmst = meanSiderealTimeDeg(jd);
  const T = (jd - J2000) / 36525;
  const { dPsi } = nutation(T);
  const eps = meanObliquity(T);
  const eqEq = dPsi * Math.cos(eps) * RAD;
  const gast = mod360(gmst + eqEq);
  const lst = mod360(gast + lonRad * RAD);
  return lst * DEG;
}

// MC tropical ecliptic longitude (radians) from RAMC
function mcLongitude(ramc, eps) {
  // tan(MC) = tan(RAMC)/cos(eps)
  let mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
  return mod2pi(mc);
}

// Ascendant tropical ecliptic longitude (radians)
function ascendant(ramc, eps, lat) {
  // Meeus 27.3
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  let asc = Math.atan2(y, x);
  // Make sure asc is in opposite hemisphere from MC (on eastern horizon)
  asc = mod2pi(asc);
  // Check that asc is within the "eastern" half
  let diff = asc - mcLongitude(ramc, eps);
  diff = ((diff % TWO_PI) + TWO_PI) % TWO_PI;
  // Per Meeus: (ASC - MC) mod 2π must lie in (0, π). If the atan2 result
  // landed in the other half, add π to flip to the true ascendant.
  if (diff > Math.PI) {
    asc = mod2pi(asc + Math.PI);
  }
  return asc;
}

// ---- Whole Sign ----
// House 1 = sign containing ASC, starting at 0° of that sign.
function housesWholeSign(asc) {
  const signStart = Math.floor(asc / (Math.PI / 6)) * (Math.PI / 6);
  const cusps = [];
  for (let i = 0; i < 12; i++) {
    cusps.push(mod2pi(signStart + i * Math.PI / 6));
  }
  return cusps;
}

// ---- Placidus ----
// Classical semi-arc method. Uses iteration for intermediate cusps.
function housesPlacidus(ramc, eps, lat) {
  const mc = mcLongitude(ramc, eps);
  const asc = ascendant(ramc, eps, lat);
  // Cusps 1=ASC, 10=MC, 7=ASC+180, 4=MC+180
  const cusps = new Array(12);
  cusps[0] = asc;
  cusps[9] = mc;
  cusps[6] = mod2pi(asc + Math.PI);
  cusps[3] = mod2pi(mc + Math.PI);
  // Intermediate cusps 11, 12, 2, 3 by Placidus semi-arc division
  // F = 1/3, 2/3 of the semi-arc
  // For cusp H (H = 11, 12, 2, 3):
  //   RAMC offset: for 11: +30°, for 12: +60°, for 2: +120°, for 3: +150° (from MC)
  //   F factor depends on house
  const placidusCusp = (H) => {
    // H = 11: n=1, day=true; 12: n=2 day; 2: n=2 night; 3: n=1 night
    // Using Meeus algorithm
    let n, ramcH;
    if (H === 11) { n = 1/3; ramcH = ramc + (30*DEG); }
    else if (H === 12) { n = 2/3; ramcH = ramc + (60*DEG); }
    else if (H === 2) { n = 2/3; ramcH = ramc + (120*DEG); }
    else if (H === 3) { n = 1/3; ramcH = ramc + (150*DEG); }
    // Iterative solution for ecliptic longitude lambda
    // such that the arc from lambda's meridian passage equals n × semi-arc
    let lambda = 0;
    // Initial guess: project ramcH onto ecliptic
    lambda = Math.atan2(Math.sin(ramcH), Math.cos(ramcH) * Math.cos(eps));
    for (let iter = 0; iter < 10; iter++) {
      // Declination of point at ecliptic longitude lambda
      const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
      // Hour angle factor
      const F = (H === 11 || H === 12) ? 1 : -1;
      // Semi-diurnal arc for this declination at this latitude
      const cosHA = -Math.tan(lat) * Math.tan(decl);
      if (cosHA < -1 || cosHA > 1) {
        // Circumpolar - fall back to equal house approximation
        if (H === 11) return mod2pi(mc + Math.PI/6);
        if (H === 12) return mod2pi(mc + Math.PI/3);
        if (H === 2)  return mod2pi(asc + Math.PI/6);
        if (H === 3)  return mod2pi(asc + Math.PI/3);
      }
      const HA = Math.acos(cosHA); // diurnal semi-arc
      // Desired: the hour angle of lambda should equal n*HA (for upper houses)
      // RA of lambda
      const ra = Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda));
      // Target RA: ramc + n*HA*F
      const targetRA = mod2pi(ramc + (H === 11 ? n * HA : H === 12 ? n * HA : H === 2 ? -n * HA : -n * HA));
      // Adjust lambda toward target RA
      const raNorm = mod2pi(ra);
      let diff = targetRA - raNorm;
      if (diff > Math.PI) diff -= TWO_PI;
      if (diff < -Math.PI) diff += TWO_PI;
      // Convert RA diff to lambda diff (approximation)
      const dlam = diff * Math.cos(eps);
      lambda = mod2pi(lambda + dlam);
      if (Math.abs(dlam) < 1e-8) break;
    }
    return lambda;
  };
  cusps[10] = placidusCusp(11);  // cusp index 10 = house 11
  cusps[11] = placidusCusp(12);  // cusp index 11 = house 12
  cusps[1]  = placidusCusp(2);   // cusp index 1 = house 2
  cusps[2]  = placidusCusp(3);   // cusp index 2 = house 3
  // Opposite cusps
  cusps[4] = mod2pi(cusps[10] + Math.PI); // 5 = 11+180
  cusps[5] = mod2pi(cusps[11] + Math.PI); // 6 = 12+180
  cusps[7] = mod2pi(cusps[1] + Math.PI);  // 8 = 2+180
  cusps[8] = mod2pi(cusps[2] + Math.PI);  // 9 = 3+180
  return cusps;
}

// ---- Koch ----
// Koch houses divide the diurnal arc between ASC and MC into thirds along RA,
// using the birth latitude's specific semi-arc for the Sun's horizon crossings.
function housesKoch(ramc, eps, lat) {
  const mc = mcLongitude(ramc, eps);
  const asc = ascendant(ramc, eps, lat);
  const cusps = new Array(12);
  cusps[0] = asc;
  cusps[9] = mc;
  cusps[6] = mod2pi(asc + Math.PI);
  cusps[3] = mod2pi(mc + Math.PI);
  // Koch: cusps 11, 12 between MC and ASC using RAMC+10°, RAMC+20° (no wait)
  // Actually Koch uses RAMC + 1/3 × HA_asc, where HA_asc is the hour angle of ASC
  // HA of ASC = 90° (definition), so... let me use standard Koch formula:
  // For cusp H (11, 12, 2, 3):
  //   alpha_H = RAMC + K*30° where K = offset
  //   but we must derive lambda from this alpha using the Koch transform
  // Standard Koch: the ecliptic point whose oblique ascension at birth latitude
  // equals RAMC + K*30°, K = 1 for cusp 11, K=2 for cusp 12, K=4 for cusp 2, K=5 for cusp 3
  const kochCusp = (K) => {
    const alphaH = mod2pi(ramc + K * 30 * DEG);
    // Oblique ascension difference at latitude lat: asc_diff = asin(tan(lat)*tan(decl))
    // lambda from alphaH via: solve for lambda such that asc_diff_for_lambda = alphaH - RA_lambda
    let lambda = Math.atan2(Math.sin(alphaH), Math.cos(alphaH) * Math.cos(eps));
    for (let iter = 0; iter < 15; iter++) {
      const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
      const td = Math.tan(lat) * Math.tan(decl);
      if (td < -1 || td > 1) {
        // Fallback
        return mod2pi(asc + (K - 3) * Math.PI / 6);
      }
      const oblAscDiff = Math.asin(td);
      const ra = Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda));
      // Want: RA + oblAscDiff = alphaH
      let diff = alphaH - (ra + oblAscDiff);
      if (diff > Math.PI) diff -= TWO_PI;
      if (diff < -Math.PI) diff += TWO_PI;
      lambda = mod2pi(lambda + diff * 0.8);
      if (Math.abs(diff) < 1e-8) break;
    }
    return lambda;
  };
  cusps[10] = kochCusp(1);
  cusps[11] = kochCusp(2);
  cusps[1]  = kochCusp(4);
  cusps[2]  = kochCusp(5);
  cusps[4] = mod2pi(cusps[10] + Math.PI);
  cusps[5] = mod2pi(cusps[11] + Math.PI);
  cusps[7] = mod2pi(cusps[1] + Math.PI);
  cusps[8] = mod2pi(cusps[2] + Math.PI);
  return cusps;
}

// Main dispatcher
function calculateHouses(system, jd, lat, lonEast) {
  const T = (jd - J2000) / 36525;
  const eps = meanObliquity(T);
  const ramc = ramcRad(jd, lonEast);
  const asc = ascendant(ramc, eps, lat);
  const mc = mcLongitude(ramc, eps);
  let cusps;
  if (system === 'whole-sign') cusps = housesWholeSign(asc);
  else if (system === 'koch') cusps = housesKoch(ramc, eps, lat);
  else cusps = housesPlacidus(ramc, eps, lat);
  return { cusps, asc, mc, ramc, eps };
}

// Determine which house a tropical longitude falls in (given cusps)
function houseOfLongitude(lon, cusps) {
  for (let h = 0; h < 12; h++) {
    const a = cusps[h];
    const b = cusps[(h + 1) % 12];
    let diff = b - a;
    if (diff < 0) diff += TWO_PI;
    let rel = lon - a;
    if (rel < 0) rel += TWO_PI;
    if (rel < diff) return h + 1;
  }
  return 1;
}
