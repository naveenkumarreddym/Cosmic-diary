/* =============================================================
 * CHART RENDERERS (SVG)
 * - renderWesternChart(chart) -> SVG string
 * - renderVedicNorthChart(chart) -> SVG string
 * - renderVedicSouthChart(chart) -> SVG string
 * ============================================================= */

// ----------------------------------------------------------------
// WESTERN CIRCULAR CHART
// Convention:
//   ASC at 9 o'clock (west), longitudes increase counter-clockwise.
//   phi_svg (degrees, CW from east, y-down) = 180 - (λ - λ_asc)
// ----------------------------------------------------------------

function polarToSvg(cx, cy, r, phiDeg) {
  const rad = phiDeg * DEG;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function renderWesternChart(chart) {
  const size = 720;
  const cx = size / 2, cy = size / 2;
  const rOuter = 340;
  const rSignOuter = 340;
  const rSignInner = 295;
  const rHouseOuter = 295;
  const rHouseInner = 215;
  const rPlanet = 245;
  const rCenter = 150;
  const ascLon = chart.houses.asc * RAD; // degrees
  const signs = SIGNS;

  const lonToPhi = (lonDeg) => mod360(180 - (lonDeg - ascLon));

  // Pad viewBox so ASC/MC labels (at rOuter+18) don't get clipped
  const pad = 30;
  let svg = `<svg viewBox="${-pad} ${-pad} ${size + 2*pad} ${size + 2*pad}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Western natal chart">
  <defs>
    <radialGradient id="wbg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1a2139" />
      <stop offset="100%" stop-color="#0a0e1a" />
    </radialGradient>
  </defs>
  <rect x="${-pad}" y="${-pad}" width="${size + 2*pad}" height="${size + 2*pad}" fill="url(#wbg)" />
  <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="#e6b450" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="${rSignInner}" fill="none" stroke="#3d4970" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy}" r="${rHouseInner}" fill="none" stroke="#3d4970" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy}" r="${rCenter}" fill="none" stroke="#2a3350" stroke-width="1"/>`;

  // Zodiac sign divisions (every 30° starting from 0° Aries)
  for (let i = 0; i < 12; i++) {
    const lonBoundary = i * 30;
    const phi = lonToPhi(lonBoundary);
    const [x1, y1] = polarToSvg(cx, cy, rSignInner, phi);
    const [x2, y2] = polarToSvg(cx, cy, rSignOuter, phi);
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#e6b450" stroke-width="1"/>`;
  }

  // Degree marks (every 5°)
  for (let d = 0; d < 360; d += 5) {
    const phi = lonToPhi(d);
    const tickLen = (d % 30 === 0) ? 12 : (d % 10 === 0) ? 8 : 4;
    const [x1, y1] = polarToSvg(cx, cy, rSignInner, phi);
    const [x2, y2] = polarToSvg(cx, cy, rSignInner + tickLen, phi);
    const stroke = d % 30 === 0 ? '#e6b450' : '#6b7496';
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="0.7"/>`;
  }

  // Sign glyphs (centered in each sign band)
  for (let i = 0; i < 12; i++) {
    const lonCenter = i * 30 + 15;
    const phi = lonToPhi(lonCenter);
    const [x, y] = polarToSvg(cx, cy, (rSignInner + rSignOuter) / 2, phi);
    const elementColor = { Fire: '#ff8b6b', Earth: '#a8d67e', Air: '#7ec7ff', Water: '#b392e7' }[signs[i].element];
    svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="22" fill="${elementColor}" text-anchor="middle" dominant-baseline="central" font-family="serif">${signs[i].glyph}</text>`;
  }

  // House cusps
  const cusps = chart.houses.cusps;
  for (let h = 0; h < 12; h++) {
    const lonDeg = cusps[h] * RAD;
    const phi = lonToPhi(lonDeg);
    const [x1, y1] = polarToSvg(cx, cy, rCenter, phi);
    const [x2, y2] = polarToSvg(cx, cy, rHouseOuter, phi);
    // ASC (h=0) and MC (h=9) thicker
    const isAngular = (h === 0 || h === 3 || h === 6 || h === 9);
    const stroke = isAngular ? '#e6b450' : '#3d4970';
    const width = isAngular ? 2 : 0.8;
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${width}"/>`;
  }

  // House numbers (centered in each house band)
  for (let h = 0; h < 12; h++) {
    const c1 = cusps[h] * RAD;
    let c2 = cusps[(h + 1) % 12] * RAD;
    let delta = c2 - c1;
    if (delta < 0) delta += 360;
    const midLon = c1 + delta / 2;
    const phi = lonToPhi(midLon);
    const [x, y] = polarToSvg(cx, cy, (rCenter + rHouseInner) / 2, phi);
    svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="13" fill="#6b7496" text-anchor="middle" dominant-baseline="central">${h + 1}</text>`;
  }

  // ASC / MC labels
  const ascPhi = lonToPhi(ascLon);
  const [ax, ay] = polarToSvg(cx, cy, rOuter + 18, ascPhi);
  svg += `<text x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" font-size="14" fill="#e6b450" text-anchor="middle" dominant-baseline="central" font-weight="700">ASC</text>`;
  const mcPhi = lonToPhi(chart.houses.mc * RAD);
  const [mx, my] = polarToSvg(cx, cy, rOuter + 18, mcPhi);
  svg += `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" font-size="14" fill="#e6b450" text-anchor="middle" dominant-baseline="central" font-weight="700">MC</text>`;

  // Aspect lines (inside center circle)
  for (const asp of chart.aspects) {
    if (asp.p1 === 'uranus' || asp.p1 === 'neptune' || asp.p2 === 'uranus' || asp.p2 === 'neptune') {
      // still include but thinner
    }
    const l1 = chart.positions[asp.p1].tropical * RAD;
    const l2 = chart.positions[asp.p2].tropical * RAD;
    const [x1, y1] = polarToSvg(cx, cy, rCenter, lonToPhi(l1));
    const [x2, y2] = polarToSvg(cx, cy, rCenter, lonToPhi(l2));
    const color = (asp.aspect === 'Conjunction' || asp.aspect === 'Opposition' || asp.aspect === 'Square') ? '#ff6b6b' :
                  (asp.aspect === 'Trine' || asp.aspect === 'Sextile') ? '#4ade80' : '#8892b5';
    const op = asp.exact ? 0.9 : 0.45;
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="${op}"/>`;
  }

  // Planet glyphs — avoid overlap by stacking radially
  const planets = [...PLANET_ORDER].map(k => ({
    k,
    lon: chart.positions[k].tropical * RAD,
    info: chart.positions[k]
  })).sort((a, b) => a.lon - b.lon);
  // Simple spread: adjust radius for planets within 6° of each other
  const placedRadii = [];
  for (let i = 0; i < planets.length; i++) {
    let r = rPlanet;
    for (let j = 0; j < i; j++) {
      let diff = Math.abs(planets[i].lon - planets[j].lon);
      if (diff > 180) diff = 360 - diff;
      if (diff < 7 && Math.abs(placedRadii[j] - r) < 22) {
        r = placedRadii[j] - 22;
      }
    }
    placedRadii.push(r);
  }
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const phi = lonToPhi(p.lon);
    const r = placedRadii[i];
    const [x, y] = polarToSvg(cx, cy, r, phi);
    const [xl, yl] = polarToSvg(cx, cy, rHouseOuter - 2, phi); // tick mark
    const [xl2, yl2] = polarToSvg(cx, cy, rHouseOuter - 10, phi);
    svg += `<line x1="${xl.toFixed(1)}" y1="${yl.toFixed(1)}" x2="${xl2.toFixed(1)}" y2="${yl2.toFixed(1)}" stroke="#e6b450" stroke-width="1.2"/>`;
    const retroMark = p.info.retrograde ? '<tspan fill="#9d7bff" font-size="11">ᴿ</tspan>' : '';
    svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="22" fill="#e6b450" text-anchor="middle" dominant-baseline="central" font-family="serif">${p.info.glyph}${retroMark}</text>`;
    // Degree label below glyph
    const [xd, yd] = polarToSvg(cx, cy, r - 18, phi);
    svg += `<text x="${xd.toFixed(1)}" y="${yd.toFixed(1)}" font-size="9" fill="#8892b5" text-anchor="middle" dominant-baseline="central">${Math.floor(p.info.tropSign.degInSign)}°</text>`;
  }

  // Center label
  svg += `<text x="${cx}" y="${cy - 6}" font-size="13" fill="#8892b5" text-anchor="middle">Western</text>`;
  svg += `<text x="${cx}" y="${cy + 12}" font-size="11" fill="#6b7496" text-anchor="middle">${chart.houses.system === 'placidus' ? 'Placidus' : chart.houses.system === 'koch' ? 'Koch' : 'Whole Sign'}</text>`;

  svg += `</svg>`;
  return svg;
}

// ----------------------------------------------------------------
// VEDIC NORTH INDIAN CHART (Diamond)
// Fixed 12 positions; house 1 always at top.
// Signs are rotated so that Lagna sign appears in house 1.
// ----------------------------------------------------------------

const NORTH_HOUSE_POLYGONS = [
  // [house_number, [points as [x,y]], labelXY]
  [1,  [[50,0], [75,25], [50,50], [25,25]], [50, 18]],
  [2,  [[25,25], [50,0], [0,0]], [20, 10]],
  [3,  [[0,0], [25,25], [0,50]], [10, 20]],
  [4,  [[0,50], [25,75], [50,50], [25,25]], [18, 50]],
  [5,  [[0,50], [25,75], [0,100]], [10, 80]],
  [6,  [[0,100], [25,75], [50,100]], [20, 90]],
  [7,  [[50,100], [75,75], [50,50], [25,75]], [50, 78]],
  [8,  [[50,100], [75,75], [100,100]], [80, 90]],
  [9,  [[100,100], [75,75], [100,50]], [90, 80]],
  [10, [[100,50], [75,75], [50,50], [75,25]], [82, 50]],
  [11, [[100,50], [75,25], [100,0]], [90, 20]],
  [12, [[100,0], [75,25], [50,0]], [80, 10]]
];

function renderVedicNorthChart(chart) {
  const size = 560;
  const scale = size / 100;
  const ascSignIdx = chart.vedic.ascSign.signIdx; // 0 = Aries, etc.
  // Group planets by sidereal sign (whole-sign house)
  const planetsBySign = {};
  for (const k of PLANET_ORDER) {
    const s = chart.positions[k].sidSign.signIdx;
    if (!planetsBySign[s]) planetsBySign[s] = [];
    planetsBySign[s].push(chart.positions[k]);
  }

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vedic North Indian chart">
  <defs>
    <linearGradient id="nbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a2139" />
      <stop offset="100%" stop-color="#121829" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#nbg)" />`;

  // Outer square frame
  svg += `<rect x="10" y="10" width="${size-20}" height="${size-20}" fill="none" stroke="#e6b450" stroke-width="2.5"/>`;
  // Inner diamond (vertices at midpoints of outer square)
  const s = size - 20;
  svg += `<polygon points="${10+s/2},10 ${10+s},${10+s/2} ${10+s/2},${10+s} 10,${10+s/2}" fill="none" stroke="#e6b450" stroke-width="2"/>`;
  // Two diagonals of outer square
  svg += `<line x1="10" y1="10" x2="${10+s}" y2="${10+s}" stroke="#e6b450" stroke-width="2"/>`;
  svg += `<line x1="${10+s}" y1="10" x2="10" y2="${10+s}" stroke="#e6b450" stroke-width="2"/>`;

  // Label each house with sign + planets
  for (const [house, poly, label] of NORTH_HOUSE_POLYGONS) {
    const signIdx = (ascSignIdx + house - 1) % 12;
    const lx = 10 + label[0] * (s / 100);
    const ly = 10 + label[1] * (s / 100);
    // Sign number (Rāśi number)
    svg += `<text x="${lx}" y="${ly - 8}" font-size="11" fill="#8892b5" text-anchor="middle">${signIdx + 1}</text>`;
    // Sign glyph
    svg += `<text x="${lx}" y="${ly + 6}" font-size="14" fill="#e6b450" text-anchor="middle" font-family="serif">${SIGNS[signIdx].glyph}</text>`;
    // Planets
    const ps = planetsBySign[signIdx] || [];
    let dy = 22;
    for (const p of ps) {
      const retro = p.retrograde ? ' ᴿ' : '';
      const isAsc = (house === 1); // special: mark ASC degree in house 1
      svg += `<text x="${lx}" y="${ly + dy}" font-size="11" fill="${p.glyph === '☉' ? '#ffd88a' : '#c4d0ff'}" text-anchor="middle">${p.abbr} ${Math.floor(p.sidSign.degInSign)}°${retro}</text>`;
      dy += 14;
    }
    // Mark ASC in house 1
    if (house === 1) {
      const ascDeg = Math.floor(chart.vedic.ascSign.degInSign);
      svg += `<text x="${lx}" y="${ly + dy}" font-size="10" fill="#4ade80" text-anchor="middle" font-weight="700">Asc ${ascDeg}°</text>`;
    }
  }

  return svg + `</svg>`;
}

// ----------------------------------------------------------------
// VEDIC SOUTH INDIAN CHART (4x4 grid)
// Signs fixed in natural zodiac order, clockwise from top-left = Pisces.
// ----------------------------------------------------------------

// Each cell: [signIdx (0=Ari..11=Pi), gridX (0-3), gridY (0-3)]
// Layout: top row Pisces(11), Aries(0), Taurus(1), Gemini(2)
// Right col: Cancer(3), Leo(4)
// Bottom row: Virgo(5), Libra(6), Scorpio(7), Sagittarius(8)
// Left col: Capricorn(9), Aquarius(10)
const SOUTH_CELLS = [
  [11, 0, 0], [0, 1, 0], [1, 2, 0], [2, 3, 0],   // top row: Pi, Ar, Ta, Ge
  [3, 3, 1], [4, 3, 2],                           // right col going down: Ca, Le
  [5, 3, 3], [6, 2, 3], [7, 1, 3], [8, 0, 3],    // bottom row R→L: Vi, Li, Sc, Sg
  [9, 0, 2], [10, 0, 1]                           // left col going up: Cp, Aq
];

function renderVedicSouthChart(chart) {
  const size = 560;
  const m = 12; // margin
  const cell = (size - m*2) / 4;

  const ascSignIdx = chart.vedic.ascSign.signIdx;
  const planetsBySign = {};
  for (const k of PLANET_ORDER) {
    const s = chart.positions[k].sidSign.signIdx;
    if (!planetsBySign[s]) planetsBySign[s] = [];
    planetsBySign[s].push(chart.positions[k]);
  }

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vedic South Indian chart">
  <defs>
    <linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a2139" />
      <stop offset="100%" stop-color="#121829" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#sbg)" />`;

  // 4x4 grid
  svg += `<rect x="${m}" y="${m}" width="${size-2*m}" height="${size-2*m}" fill="none" stroke="#e6b450" stroke-width="2.5"/>`;
  for (let i = 1; i < 4; i++) {
    svg += `<line x1="${m + i*cell}" y1="${m}" x2="${m + i*cell}" y2="${size-m}" stroke="#3d4970" stroke-width="1"/>`;
    svg += `<line x1="${m}" y1="${m + i*cell}" x2="${size-m}" y2="${m + i*cell}" stroke="#3d4970" stroke-width="1"/>`;
  }
  // Fill inner (non-zodiac) cells
  for (let gx = 1; gx <= 2; gx++) {
    for (let gy = 1; gy <= 2; gy++) {
      svg += `<rect x="${m + gx*cell}" y="${m + gy*cell}" width="${cell}" height="${cell}" fill="#0a0e1a" />`;
    }
  }
  // Center label
  const cxC = size / 2, cyC = size / 2;
  svg += `<text x="${cxC}" y="${cyC - 16}" font-size="18" fill="#e6b450" text-anchor="middle" font-weight="700">Rāśi</text>`;
  svg += `<text x="${cxC}" y="${cyC + 6}" font-size="12" fill="#8892b5" text-anchor="middle">Lagna: ${chart.vedic.ascSign.sign}</text>`;
  svg += `<text x="${cxC}" y="${cyC + 22}" font-size="11" fill="#8892b5" text-anchor="middle">${chart.vedic.ascSign.formatted}</text>`;

  // Each zodiac cell
  for (const [signIdx, gx, gy] of SOUTH_CELLS) {
    const x0 = m + gx * cell;
    const y0 = m + gy * cell;
    // Mark Lagna cell
    const isLagna = signIdx === ascSignIdx;
    if (isLagna) {
      svg += `<rect x="${x0+1}" y="${y0+1}" width="${cell-2}" height="${cell-2}" fill="rgba(230,180,80,0.08)" stroke="#e6b450" stroke-width="2"/>`;
    }
    // Sign name + glyph at top
    svg += `<text x="${x0 + 6}" y="${y0 + 16}" font-size="11" fill="#e6b450" font-family="serif">${SIGNS[signIdx].glyph} ${SIGNS[signIdx].name.substring(0,3)}</text>`;
    if (isLagna) {
      svg += `<text x="${x0 + cell - 6}" y="${y0 + 16}" font-size="10" fill="#4ade80" text-anchor="end" font-weight="700">Asc</text>`;
    }
    // Planets
    const ps = planetsBySign[signIdx] || [];
    let dy = 34;
    for (const p of ps) {
      const retro = p.retrograde ? ' ᴿ' : '';
      svg += `<text x="${x0 + cell/2}" y="${y0 + dy}" font-size="11" fill="${p.glyph === '☉' ? '#ffd88a' : '#c4d0ff'}" text-anchor="middle">${p.abbr} ${Math.floor(p.sidSign.degInSign)}°${retro}</text>`;
      dy += 14;
    }
  }

  return svg + `</svg>`;
}
