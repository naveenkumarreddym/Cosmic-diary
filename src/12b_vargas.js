/* =============================================================
 * DIVISIONAL CHARTS (VARGAS) — Common 9 (D1 / D2 / D3 / D7 / D9 /
 * D10 / D12 / D30 / D60)
 * Computes the varga sign for a sidereal longitude, and renders a
 * compact South-Indian-style mini-chart for each varga.
 * ============================================================= */

const VARGAS = [
  { id: 'D1',  num: 1,  name: 'Rāśi',         purpose: 'Body, overall life' },
  { id: 'D2',  num: 2,  name: 'Horā',          purpose: 'Wealth' },
  { id: 'D3',  num: 3,  name: 'Drekkāṇa',      purpose: 'Siblings, courage' },
  { id: 'D7',  num: 7,  name: 'Saptāṁśa',      purpose: 'Children, progeny' },
  { id: 'D9',  num: 9,  name: 'Navāṁśa',       purpose: 'Spouse, dharma, inner nature' },
  { id: 'D10', num: 10, name: 'Daśāṁśa',       purpose: 'Career, karma in work' },
  { id: 'D12', num: 12, name: 'Dvādaśāṁśa',    purpose: 'Parents, ancestry' },
  { id: 'D30', num: 30, name: 'Triṁśāṁśa',     purpose: 'Evils, strengths, character' },
  { id: 'D60', num: 60, name: 'Ṣaṣṭiāṁśa',     purpose: 'Past-life karma, fine-tuning' }
];

// Sign classifications (sign indices are 0=Aries … 11=Pisces)
function isOddSign(s)  { return s % 2 === 0; }        // Aries, Gemini, Leo, Libra, Sag, Aq
function isMovable(s)  { return s === 0 || s === 3 || s === 6 || s === 9; }   // Ar, Ca, Li, Cp
function isFixed(s)    { return s === 1 || s === 4 || s === 7 || s === 10; }  // Ta, Le, Sc, Aq
function isDual(s)     { return s === 2 || s === 5 || s === 8 || s === 11; }  // Ge, Vi, Sg, Pi

/**
 * Compute varga sign index for a sidereal longitude.
 * @param {number} lonRad sidereal longitude in radians
 * @param {string} vargaId one of 'D1'...'D60'
 * @returns {number} sign index (0-11)
 */
function vargaSign(lonRad, vargaId) {
  const lonDeg = mod360(lonRad * RAD);
  const signIdx = Math.floor(lonDeg / 30);
  const deg = lonDeg - signIdx * 30;    // 0° … 30° within the sign

  switch (vargaId) {
    case 'D1':
      return signIdx;

    case 'D2': {
      // Each sign split into 2 horas of 15° each.
      // Odd signs: 0-15° → Leo (Sun's hora),  15-30° → Cancer (Moon's hora)
      // Even signs: 0-15° → Cancer,            15-30° → Leo
      const firstHalf = deg < 15;
      if (isOddSign(signIdx)) return firstHalf ? 4 : 3;    // Leo=4, Cancer=3
      else                    return firstHalf ? 3 : 4;
    }

    case 'D3': {
      // 3 drekkanas of 10° each.
      // Part 0: same sign, Part 1: +4 (5th from), Part 2: +8 (9th from)
      const part = Math.floor(deg / 10);           // 0, 1, 2
      return (signIdx + part * 4) % 12;
    }

    case 'D7': {
      // 7 parts of 30/7° each.
      // Odd: count from same sign. Even: count from 7th sign (signIdx+6).
      const part = Math.floor(deg / (30 / 7));
      const start = isOddSign(signIdx) ? signIdx : (signIdx + 6) % 12;
      return (start + part) % 12;
    }

    case 'D9': {
      // 9 navamshas of 3°20' each.
      // Movable: start from same. Fixed: start from 9th from self (+8). Dual: start from 5th (+4).
      const part = Math.floor(deg / (30 / 9));
      let start;
      if (isMovable(signIdx))    start = signIdx;
      else if (isFixed(signIdx)) start = (signIdx + 8) % 12;
      else                       start = (signIdx + 4) % 12;
      return (start + part) % 12;
    }

    case 'D10': {
      // 10 parts of 3° each.
      // Odd: start from same. Even: start from 9th from self (+8).
      const part = Math.floor(deg / 3);
      const start = isOddSign(signIdx) ? signIdx : (signIdx + 8) % 12;
      return (start + part) % 12;
    }

    case 'D12': {
      // 12 parts of 2.5° each. Start from self for all signs.
      const part = Math.floor(deg / 2.5);
      return (signIdx + part) % 12;
    }

    case 'D30': {
      // Unequal divisions. Classical Parashara rule.
      if (isOddSign(signIdx)) {
        if (deg <  5) return 0;   // Aries      (Mars)
        if (deg < 10) return 10;  // Aquarius   (Saturn)
        if (deg < 18) return 8;   // Sagittarius(Jupiter)
        if (deg < 25) return 2;   // Gemini     (Mercury)
        return 6;                 // Libra      (Venus)
      } else {
        if (deg <  5) return 1;   // Taurus     (Venus)
        if (deg < 12) return 5;   // Virgo      (Mercury)
        if (deg < 20) return 11;  // Pisces     (Jupiter)
        if (deg < 25) return 9;   // Capricorn  (Saturn)
        return 7;                 // Scorpio    (Mars)
      }
    }

    case 'D60': {
      // 60 shashtiamshas of 30' each.
      // k = floor(deg × 2), 0..59
      // Odd: varga = (signIdx + k) mod 12
      // Even: varga = (signIdx + 11 - (k mod 12)) mod 12   (backward-from-self convention)
      const k = Math.floor(deg * 2);
      if (isOddSign(signIdx)) return (signIdx + k) % 12;
      else                    return ((signIdx + 11 - (k % 12)) % 12 + 12) % 12;
    }

    default:
      return signIdx;
  }
}

/**
 * Build a full divisional chart from a natal chart object.
 * Returns { ascSignIdx, planets: { [planet]: { signIdx, signName, signGlyph, house, retrograde, abbr } } }
 */
function buildVargaChart(chart, vargaId) {
  const ascSignIdx = vargaSign(chart.vedic.asc, vargaId);
  const planets = {};
  for (const k of PLANET_ORDER) {
    const p = chart.positions[k];
    const sIdx = vargaSign(p.sidereal, vargaId);
    const house = ((sIdx - ascSignIdx + 12) % 12) + 1;
    planets[k] = {
      signIdx: sIdx,
      signName: SIGNS[sIdx].name,
      signGlyph: SIGNS[sIdx].glyph,
      house,
      retrograde: p.retrograde,
      abbr: p.abbr,
      glyph: p.glyph
    };
  }
  return { vargaId, ascSignIdx, planets };
}

/**
 * Render a compact South-Indian mini chart for a varga.
 * Uses the same SOUTH_CELLS layout defined in 12_render.js.
 */
function renderVargaMiniChart(varga, vargaMeta, sizePx) {
  const size = sizePx || 260;
  const m = 6;
  const cell = (size - m * 2) / 4;
  const ascIdx = varga.ascSignIdx;

  // Bucket planets by sign
  const bySign = {};
  for (const k of PLANET_ORDER) {
    const v = varga.planets[k];
    if (!bySign[v.signIdx]) bySign[v.signIdx] = [];
    bySign[v.signIdx].push(v);
  }

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${vargaMeta.id} ${vargaMeta.name} chart">`;
  svg += `<rect x="${m}" y="${m}" width="${size - m * 2}" height="${size - m * 2}" fill="#0e1426" stroke="#e6b450" stroke-width="1.6"/>`;
  for (let i = 1; i < 4; i++) {
    svg += `<line x1="${m + i * cell}" y1="${m}" x2="${m + i * cell}" y2="${size - m}" stroke="#2a3350" stroke-width="0.7"/>`;
    svg += `<line x1="${m}" y1="${m + i * cell}" x2="${size - m}" y2="${m + i * cell}" stroke="#2a3350" stroke-width="0.7"/>`;
  }

  // Center label: varga ID + name
  const cx = size / 2, cy = size / 2;
  svg += `<text x="${cx}" y="${cy - 6}" font-size="${Math.max(12, size * 0.055)}" fill="#e6b450" text-anchor="middle" font-weight="700">${vargaMeta.id}</text>`;
  svg += `<text x="${cx}" y="${cy + 10}" font-size="${Math.max(9, size * 0.038)}" fill="#8892b5" text-anchor="middle">${vargaMeta.name}</text>`;

  for (const [signIdx, gx, gy] of SOUTH_CELLS) {
    const x0 = m + gx * cell;
    const y0 = m + gy * cell;
    const isAsc = signIdx === ascIdx;

    if (isAsc) {
      svg += `<rect x="${x0 + 1}" y="${y0 + 1}" width="${cell - 2}" height="${cell - 2}" fill="rgba(230,180,80,0.10)" stroke="#e6b450" stroke-width="1.4"/>`;
    }
    // Sign abbrev
    svg += `<text x="${x0 + 4}" y="${y0 + 11}" font-size="${Math.max(8, size * 0.036)}" fill="#e6b450">${SIGNS[signIdx].name.substring(0, 3)}</text>`;
    if (isAsc) {
      svg += `<text x="${x0 + cell - 4}" y="${y0 + 11}" font-size="${Math.max(7, size * 0.03)}" fill="#4ade80" text-anchor="end" font-weight="700">Asc</text>`;
    }
    // Planet abbrevs
    const ps = bySign[signIdx] || [];
    const fontSize = Math.max(8, size * 0.038);
    const rowH = fontSize + 2;
    const startY = y0 + 24;
    // Join multiple planets with spaces, wrap every ~3 per row
    const perRow = 3;
    for (let i = 0; i < ps.length; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const p = ps[i];
      const color = p.glyph === '☉' ? '#ffd88a'
                  : p.glyph === '☽' ? '#c8e6ff'
                  : p.glyph === '☊' || p.glyph === '☋' ? '#b392e7'
                  : '#c4d0ff';
      const x = x0 + 4 + col * (cell / perRow);
      const y = startY + row * rowH;
      const retro = p.retrograde ? 'ᴿ' : '';
      svg += `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${color}" font-weight="600">${p.abbr}${retro}</text>`;
    }
  }
  return svg + `</svg>`;
}

/**
 * Render the complete grid of all vargas into a single HTML string.
 */
function renderAllVargas(chart) {
  let html = '';
  for (const meta of VARGAS) {
    const v = buildVargaChart(chart, meta.id);
    html += `<div class="varga-cell">
      <div class="varga-header">
        <span class="varga-id">${meta.id}</span>
        <span class="varga-name">${meta.name}</span>
      </div>
      <div class="varga-svg-wrap">${renderVargaMiniChart(v, meta, 260)}</div>
      <div class="varga-purpose">${meta.purpose}</div>
    </div>`;
  }
  return html;
}
