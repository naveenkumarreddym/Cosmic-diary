/* =============================================================
 * LUNAR NODES (Rahu/Ketu)
 * Mean Node: polynomial in T (Meeus 47.7)
 * True Node: Mean + major periodic terms (Meeus p.343)
 * Ketu is always 180° opposite Rahu.
 * ============================================================= */

function meanNode(jde) {
  const T = (jde - J2000) / 36525;
  // Meeus 47.7 — Mean longitude of ascending node in degrees
  const Om = 125.04452 - 1934.136261*T + 0.0020708*T*T + T*T*T/450000;
  const T2 = (jde - J2000) / 36525;
  const { dPsi } = nutation(T2);
  return mod2pi(Om * DEG + dPsi);
}

function trueNode(jde) {
  const T = (jde - J2000) / 36525;
  // Start with mean
  let Om = 125.04452 - 1934.136261*T + 0.0020708*T*T + T*T*T/450000;
  // Periodic perturbations (Meeus p.343, selected terms)
  const D  = mod360(297.8501921 + 445267.1114034*T - 0.0018819*T*T);
  const M  = mod360(357.5291092 + 35999.0502909*T - 0.0001536*T*T);
  const Mp = mod360(134.9633964 + 477198.8675055*T + 0.0087414*T*T);
  const F  = mod360(93.2720950 + 483202.0175233*T - 0.0036539*T*T);
  const Dr = D*DEG, Mr = M*DEG, Mpr = Mp*DEG, Fr = F*DEG;
  // Corrections in degrees
  Om += (-1.4979 * Math.sin(2*(Dr - Fr))
        - 0.1500 * Math.sin(Mr)
        - 0.1226 * Math.sin(2*Dr)
        + 0.1176 * Math.sin(2*Fr)
        - 0.0801 * Math.sin(2*(Mpr - Fr)));
  const { dPsi } = nutation(T);
  return mod2pi(Om * DEG + dPsi);
}

function rahuKetu(jde, useTrue) {
  const rahu = useTrue ? trueNode(jde) : meanNode(jde);
  const ketu = mod2pi(rahu + Math.PI);
  return { rahu: { lon: rahu, lat: 0, r: 1 }, ketu: { lon: ketu, lat: 0, r: 1 } };
}
