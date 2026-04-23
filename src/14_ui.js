/* =============================================================
 * UI CONTROLLER
 * ============================================================= */

// Global state
let CURRENT_CHART = null;

// --- Helpers ---
function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }

function getFormValues() {
  const name = $('#name').value.trim();
  const dob = $('#dob').value;
  const tob = $('#tob').value;
  const lat = parseFloat($('#lat').value);
  const lon = parseFloat($('#lon').value);
  const tz = parseFloat($('#tz').value);
  const ayanamsaKind = $('#ayanamsa').value;
  const houseSystem = $('#house-system').value;
  const useTrueNode = $('#node-type').value === 'true';
  if (!dob || !tob || isNaN(lat) || isNaN(lon) || isNaN(tz)) {
    return null;
  }
  const [y, m, d] = dob.split('-').map(Number);
  const tobParts = tob.split(':').map(Number);
  const [hh, mm, ss] = [tobParts[0], tobParts[1], tobParts[2] || 0];
  return {
    name,
    year: y, month: m, day: d,
    hour: hh, minute: mm, second: ss,
    tzHours: tz,
    latDeg: lat, lonDeg: lon,
    ayanamsaKind, houseSystem, useTrueNode
  };
}

function renderSummary(chart) {
  const input = chart.input;
  const sun = chart.positions.sun;
  const moon = chart.positions.moon;
  const asc = chart.vedic.ascSign;
  const nak = chart.positions.moon.nakshatra;
  const ayaStr = chart.ayanamsaDeg.toFixed(4) + '°';
  const html = `
    <div class="summary-item"><div class="label">Name</div><div class="value">${input.name || '—'}</div></div>
    <div class="summary-item"><div class="label">Born</div><div class="value">${input.year}-${String(input.month).padStart(2,'0')}-${String(input.day).padStart(2,'0')} &nbsp; ${String(input.hour).padStart(2,'0')}:${String(input.minute).padStart(2,'0')}</div></div>
    <div class="summary-item"><div class="label">Location</div><div class="value">${input.latDeg.toFixed(3)}°, ${input.lonDeg.toFixed(3)}° &nbsp; UTC${input.tzHours >= 0 ? '+' : ''}${input.tzHours}</div></div>
    <div class="summary-item"><div class="label">Sun</div><div class="value"><span class="glyph">☉</span> ${formatLongitude(sun.tropical)}</div></div>
    <div class="summary-item"><div class="label">Moon</div><div class="value"><span class="glyph">☽</span> ${formatLongitude(moon.tropical)}</div></div>
    <div class="summary-item"><div class="label">Lagna (sidereal)</div><div class="value"><span class="glyph">${asc.signGlyph}</span> ${asc.sign} ${asc.formatted}</div></div>
    <div class="summary-item"><div class="label">Nakshatra</div><div class="value">${nak.nakshatra} — pada ${nak.pada}</div></div>
    <div class="summary-item"><div class="label">Ayanamsa</div><div class="value">${input.ayanamsaKind === 'lahiri' ? 'Lahiri' : 'Pushya Paksha'} ${ayaStr}</div></div>
  `;
  $('#summary').innerHTML = html;
}

function renderPositionsTable(chart) {
  // Tropical (Western) positions table
  let t = `<div class="table-title">Tropical positions (Western)</div>
  <table class="astro"><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th><th>Motion</th></tr></thead><tbody>`;
  for (const k of PLANET_ORDER) {
    const p = chart.positions[k];
    t += `<tr>
      <td><span class="glyph">${p.glyph}</span>${p.name}</td>
      <td>${p.tropSign.signGlyph} ${p.tropSign.sign}</td>
      <td>${p.tropSign.formatted}</td>
      <td>${p.westHouse}</td>
      <td>${p.retrograde ? '<span class="retro">℞ Retro</span>' : 'Direct'}</td>
    </tr>`;
  }
  t += `</tbody></table>`;
  // Sidereal (Vedic) positions table with nakshatra
  t += `<div class="table-title">Sidereal positions (Vedic)</div>
  <table class="astro"><thead><tr><th>Planet</th><th>Sign (Rāśi)</th><th>Degree</th><th>Nakshatra</th><th>Pada</th><th>House</th></tr></thead><tbody>`;
  for (const k of PLANET_ORDER) {
    const p = chart.positions[k];
    t += `<tr>
      <td><span class="glyph">${p.glyph}</span>${p.name}</td>
      <td>${p.sidSign.signGlyph} ${p.sidSign.sign}</td>
      <td>${p.sidSign.formatted}</td>
      <td>${p.nakshatra.nakshatra} <small>(${p.nakshatra.lord})</small></td>
      <td>${p.nakshatra.pada}</td>
      <td>${p.vedicHouse}</td>
    </tr>`;
  }
  t += `</tbody></table>`;
  // House cusps (Western)
  t += `<div class="table-title">Western house cusps (${chart.houses.system})</div>
  <table class="astro"><thead><tr><th>House</th><th>Cusp</th></tr></thead><tbody>`;
  for (let h = 0; h < 12; h++) {
    t += `<tr><td>${h + 1}</td><td>${formatLongitude(chart.houses.cusps[h])}</td></tr>`;
  }
  t += `</tbody></table>`;
  $('#positions-tables').innerHTML = t;
}

function renderAspects(chart) {
  if (chart.aspects.length === 0) {
    $('#western-aspects').innerHTML = '<h3>Aspects</h3><p class="muted">No major aspects within standard orbs.</p>';
    return;
  }
  let h = '<h3>Major aspects (tropical)</h3><div>';
  for (const a of chart.aspects) {
    const p1 = PLANET_INFO[a.p1], p2 = PLANET_INFO[a.p2];
    h += `<span class="aspect-item">${p1.glyph} ${a.symbol} ${p2.glyph} <small>${a.aspect} (${a.orb.toFixed(1)}°)</small></span>`;
  }
  h += '</div>';
  $('#western-aspects').innerHTML = h;
}

function renderDasha(chart) {
  const nowJD = dateToJD(new Date());
  const dasha = findCurrentDasha(chart, nowJD);
  let html = '';
  if (dasha.currentMaha) {
    const mahaLord = dasha.currentMaha.lord.toLowerCase();
    const iconSvg = planetIconHTML(mahaLord);
    html += `<div class="dasha-current">
      <div class="dasha-current-icon">${iconSvg}</div>
      <div class="dasha-current-body">
        <div class="label">Current dasha (today)</div>
        <div class="value">${dasha.currentMaha.lord} Mahā · ${dasha.currentAntar?.lord ?? '—'} Antar · ${dasha.currentPraty?.lord ?? '—'} Pratyantar</div>
        <div class="dasha-current-dates">
          Mahā: ${formatDate(dasha.currentMaha.startDate)} → ${formatDate(dasha.currentMaha.endDate)}
          ${dasha.currentAntar ? `<br>Antar: ${formatDate(dasha.currentAntar.startDate)} → ${formatDate(dasha.currentAntar.endDate)}` : ''}
          ${dasha.currentPraty ? `<br>Pratyantar: ${formatDate(dasha.currentPraty.startDate)} → ${formatDate(dasha.currentPraty.endDate)}` : ''}
        </div>
      </div>
    </div>`;
  }
  // Mahadasha sequence — cycles repeat every 120 years
  const cycleCount = Math.max(1, Math.round((dasha.maha[dasha.maha.length - 1].endJD - dasha.maha[0].startJD) / (120 * 365.25)));
  html += `<div class="dasha-section"><h3>Mahādaśā sequence</h3>
  <p class="muted" style="margin:-4px 0 10px;font-size:12.5px;">The 120-year Vimshottari cycle repeats indefinitely — ${cycleCount} cycle${cycleCount > 1 ? 's' : ''} shown below.</p>
  <table class="astro"><thead><tr><th>#</th><th>Lord</th><th>Start</th><th>End</th><th>Years</th></tr></thead><tbody>`;
  // Track cycle number: partial-birth dasha is cycle 1. Each time we complete
  // 120 years of cumulative duration, we increment the cycle.
  let cumulYears = 0;
  let cycleNum = 1;
  for (let i = 0; i < dasha.maha.length; i++) {
    const m = dasha.maha[i];
    const isCurrent = dasha.currentMaha && m.startJD === dasha.currentMaha.startJD;
    // If adding this dasha crosses a 120-year boundary (and it's not the first),
    // that's the start of a new cycle.
    if (i > 0 && cumulYears >= cycleNum * 120 - 0.01) {
      cycleNum++;
    }
    html += `<tr style="${isCurrent ? 'background:rgba(230,180,80,0.08);' : ''}">
      <td style="color:var(--text-muted);font-size:11px;">C${cycleNum}</td>
      <td><strong>${m.lord}</strong></td>
      <td>${formatDate(m.startDate)}</td>
      <td>${formatDate(m.endDate)}</td>
      <td>${m.years.toFixed(2)}</td>
    </tr>`;
    cumulYears += m.years;
  }
  html += `</tbody></table></div>`;
  // Current antardashas
  if (dasha.antar && dasha.currentMaha) {
    html += `<div class="dasha-section"><h3>Antardaśā within ${dasha.currentMaha.lord} Mahā</h3>
    <table class="astro"><thead><tr><th>Lord</th><th>Start</th><th>End</th><th>Years</th></tr></thead><tbody>`;
    for (const a of dasha.antar) {
      const isCurrent = dasha.currentAntar && a.startJD === dasha.currentAntar.startJD;
      html += `<tr style="${isCurrent ? 'background:rgba(230,180,80,0.08);' : ''}">
        <td>${a.lord}</td>
        <td>${formatDate(a.startDate)}</td>
        <td>${formatDate(a.endDate)}</td>
        <td>${a.years.toFixed(2)}</td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
  }
  // Current pratyantardashas
  if (dasha.praty && dasha.currentAntar) {
    html += `<div class="dasha-section"><h3>Pratyantar within ${dasha.currentAntar.lord} Antar</h3>
    <table class="astro"><thead><tr><th>Lord</th><th>Start</th><th>End</th></tr></thead><tbody>`;
    for (const p of dasha.praty) {
      const isCurrent = dasha.currentPraty && p.startJD === dasha.currentPraty.startJD;
      html += `<tr style="${isCurrent ? 'background:rgba(230,180,80,0.08);' : ''}">
        <td>${p.lord}</td>
        <td>${formatDate(p.startDate)}</td>
        <td>${formatDate(p.endDate)}</td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
  }
  $('#dasha-view').innerHTML = html;
}

function dateToJD(d) {
  return julianDay(d.getFullYear(), d.getMonth() + 1, d.getDate(),
                   d.getHours(), d.getMinutes(), d.getSeconds())
    - (-d.getTimezoneOffset() / 60) / 24;
}

function renderAllTabs(chart) {
  $('#results').classList.remove('hidden');
  renderSummary(chart);
  $('#western-chart').innerHTML = renderWesternChart(chart);
  renderAspects(chart);
  $('#vedic-n-chart').innerHTML = renderVedicNorthChart(chart);
  $('#vedic-n-meta').innerHTML = `<strong>Lagna:</strong> ${chart.vedic.ascSign.signGlyph} ${chart.vedic.ascSign.sign} ${chart.vedic.ascSign.formatted}
    &nbsp;·&nbsp; <strong>Moon Nakshatra:</strong> ${chart.positions.moon.nakshatra.nakshatra} (${chart.positions.moon.nakshatra.lord}) — pada ${chart.positions.moon.nakshatra.pada}
    &nbsp;·&nbsp; <strong>Ayanamsa:</strong> ${chart.input.ayanamsaKind === 'lahiri' ? 'Lahiri' : 'Pushya Paksha'} (${chart.ayanamsaDeg.toFixed(4)}°)`;
  $('#vedic-s-chart').innerHTML = renderVedicSouthChart(chart);
  $('#vedic-s-meta').innerHTML = $('#vedic-n-meta').innerHTML;
  renderPositionsTable(chart);
  renderDasha(chart);
  // Reset vargas cache — new chart means old vargas are stale
  VARGAS_RENDERED = { n: false, s: false };
  $('#vargas-panel-n').classList.add('hidden');
  $('#vargas-panel-s').classList.add('hidden');
  $('#btn-toggle-vargas-n').textContent = 'Show divisional charts ▾';
  $('#btn-toggle-vargas-s').textContent = 'Show divisional charts ▾';
  // Reset zoom levels so each chart starts at 100%
  ['western-chart', 'vedic-n-chart', 'vedic-s-chart'].forEach(t => {
    ZOOM_STATE[t] = 1.0;
    updateZoom(t);
  });
  // Pre-populate transit date with today and scan range with ±5 years
  const now = new Date();
  const today = now.toISOString().substring(0, 10);
  $('#transit-date').value = today;
  const minFrom = new Date(now.getTime() - 5*365*24*3600*1000);
  const maxTo = new Date(now.getTime() + 5*365*24*3600*1000);
  $('#scan-from').value = minFrom.toISOString().substring(0, 10);
  $('#scan-to').value = maxTo.toISOString().substring(0, 10);
  // Auto-run transit for today
  computeAndRenderTransit();
}

function computeAndRenderTransit() {
  if (!CURRENT_CHART) return;
  const td = $('#transit-date').value;
  const tt = $('#transit-time').value || '12:00';
  if (!td) return;
  const [y, m, d] = td.split('-').map(Number);
  const [hh, mm] = tt.split(':').map(Number);
  const tz = CURRENT_CHART.input.tzHours;
  const tr = computeTransitPositions(y, m, d, hh, mm, CURRENT_CHART.input.ayanamsaKind,
                                      CURRENT_CHART.input.useTrueNode, tz);
  const asp = transitAspectsToNatal(tr, CURRENT_CHART.positions);
  let h = `<table class="astro"><thead><tr><th>Planet</th><th>Tropical</th><th>Sidereal</th><th>Natal aspects</th></tr></thead><tbody>`;
  for (const k of PLANET_ORDER) {
    if (!tr.tropical[k]) continue;
    const trop = longitudeToSign(tr.tropical[k].lon);
    const sid = longitudeToSign(tr.sidereal[k].lon);
    const aspectsFor = asp.filter(a => a.transitPlanet === k);
    const aspHtml = aspectsFor.map(a => {
      return `<span class="aspect-item">${a.aspect} ${PLANET_INFO[a.natalPlanet].glyph} <small>${a.orb.toFixed(1)}°</small></span>`;
    }).join('');
    const retro = tr.tropical[k].retrograde ? ' <span class="retro">℞</span>' : '';
    h += `<tr>
      <td><span class="glyph">${PLANET_INFO[k].glyph}</span>${PLANET_INFO[k].name}${retro}</td>
      <td>${trop.signGlyph} ${trop.formatted}</td>
      <td>${sid.signGlyph} ${sid.formatted}</td>
      <td>${aspHtml || '<span class="muted">—</span>'}</td>
    </tr>`;
  }
  h += `</tbody></table>`;
  $('#transit-view').innerHTML = h;
}

function runEventScan() {
  if (!CURRENT_CHART) return;
  const from = $('#scan-from').value;
  const to = $('#scan-to').value;
  if (!from || !to) return;
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fromJD = julianDay(fy, fm, fd, 0, 0, 0);
  const toJD = julianDay(ty, tm, td, 0, 0, 0);
  if (toJD - fromJD > 365 * 25) {
    $('#events-view').innerHTML = '<p class="muted">Scan range limited to 25 years. Please narrow the range.</p>';
    return;
  }
  $('#events-view').innerHTML = '<p class="muted">Scanning…</p>';
  setTimeout(() => {
    const events = scanEvents(CURRENT_CHART, fromJD, toJD,
      CURRENT_CHART.input.ayanamsaKind, CURRENT_CHART.input.useTrueNode,
      CURRENT_CHART.input.tzHours);
    if (events.length === 0) {
      $('#events-view').innerHTML = '<p class="muted">No major events detected in this range.</p>';
      return;
    }
    let h = '';
    for (const e of events) {
      const cls = e.type.includes('sade-sati') ? 'sade-sati' : (e.type.includes('return') ? 'major' : '');
      h += `<div class="event-item ${cls}">
        <div class="event-date">${e.date}</div>
        <div class="event-title">${e.title}</div>
        <div class="event-desc">${e.desc}</div>
      </div>`;
    }
    $('#events-view').innerHTML = h;
  }, 30);
}

// ---- City autocomplete ----
function bindPlaceSearch() {
  const input = $('#place-search');
  const box = $('#place-suggestions');
  let active = -1;
  let current = [];
  const render = (items) => {
    if (items.length === 0) {
      box.classList.remove('open');
      box.innerHTML = '';
      return;
    }
    box.innerHTML = items.map((c, i) =>
      `<div class="suggestion${i === active ? ' active' : ''}" data-idx="${i}">${c.name}<span class="suggestion-meta">${c.country} · ${c.lat.toFixed(2)}, ${c.lon.toFixed(2)} · UTC${c.tz >= 0 ? '+' : ''}${c.tz}</span></div>`
    ).join('');
    box.classList.add('open');
  };
  const pick = (i) => {
    if (i < 0 || i >= current.length) return;
    const c = current[i];
    input.value = `${c.name}, ${c.country}`;
    $('#lat').value = c.lat;
    $('#lon').value = c.lon;
    $('#tz').value = c.tz;
    box.classList.remove('open');
    box.innerHTML = '';
    current = [];
  };
  input.addEventListener('input', () => {
    active = -1;
    current = searchCities(input.value, 10);
    render(current);
  });
  input.addEventListener('keydown', (e) => {
    if (!current.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, current.length - 1); render(current); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(current); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') { box.classList.remove('open'); current = []; }
  });
  box.addEventListener('click', (e) => {
    const t = e.target.closest('.suggestion');
    if (!t) return;
    pick(parseInt(t.dataset.idx, 10));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.place-field')) {
      box.classList.remove('open');
    }
  });
}

// ---- Tab switching ----
function bindTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      $$('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
    });
  });
}

// ---- Form submit ----
function bindForm() {
  $('#birth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = getFormValues();
    if (!inp) {
      alert('Please fill all required fields with valid numbers.');
      return;
    }
    if (inp.year < 369 || inp.year > 3369) {
      alert('Year must be between 369 CE and 3369 CE.');
      return;
    }
    // Latitude: -90 (South pole) to +90 (North pole)
    if (inp.latDeg < -90 || inp.latDeg > 90) {
      alert('Latitude must be between −90° and +90°.\n(Positive = North, Negative = South.)');
      return;
    }
    // Longitude: -180 (west) to +180 (east). We also accept exactly ±180.
    if (inp.lonDeg < -180 || inp.lonDeg > 180) {
      alert('Longitude must be between −180° and +180°.\n(Positive = East, Negative = West.)');
      return;
    }
    // Polar regions have no meaningful Placidus/Koch houses — ASC/MC formulas
    // break down above ~66.5° latitude for some chart dates. Warn but allow.
    if (Math.abs(inp.latDeg) > 66.5 && (inp.houseSystem === 'placidus' || inp.houseSystem === 'koch')) {
      const proceed = confirm(
        `Latitude ${inp.latDeg.toFixed(2)}° is in the polar region.\n\n` +
        `Placidus and Koch house systems become undefined above ±66.5° for some dates ` +
        `(the Sun never rises or never sets). House cusps may be inaccurate or break.\n\n` +
        `Whole Sign houses work at any latitude. Proceed anyway?`
      );
      if (!proceed) return;
    }
    // Timezone: valid offsets range from UTC−12 (Baker Island) to UTC+14 (Kiribati)
    if (inp.tzHours < -12 || inp.tzHours > 14) {
      alert('UTC offset must be between −12 and +14 hours.\n(Real-world time zones range from UTC−12 to UTC+14.)');
      return;
    }
    try {
      CURRENT_CHART = buildChart(inp);
      renderAllTabs(CURRENT_CHART);
      // Scroll to results
      $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      alert('Error computing chart: ' + err.message);
    }
  });
  $('#btn-sample').addEventListener('click', () => {
    // Famous sample: Sri Aurobindo, 1872-08-15 04:59:00 LMT Calcutta
    // LMT for Kolkata longitude 88.3639°E = 88.3639/15 ≈ 5.891h
    $('#name').value = 'Sri Aurobindo';
    $('#dob').value = '1872-08-15';
    $('#tob').value = '04:59:00';
    $('#place-search').value = 'Kolkata, India';
    $('#lat').value = 22.5726;
    $('#lon').value = 88.3639;
    $('#tz').value = 5.8909;
  });
  $('#btn-transit-now').addEventListener('click', () => {
    const now = new Date();
    $('#transit-date').value = now.toISOString().substring(0, 10);
    $('#transit-time').value = now.toTimeString().substring(0, 5);
    computeAndRenderTransit();
  });
  $('#btn-compute-transit').addEventListener('click', computeAndRenderTransit);
  $('#btn-scan').addEventListener('click', runEventScan);
  $('#btn-gen-prompt').addEventListener('click', generatePromptHandler);
  $('#btn-copy-prompt').addEventListener('click', copyPromptHandler);
  // Minimize / expand birth details
  $('#btn-toggle-input').addEventListener('click', () => {
    $('#input-card').classList.toggle('collapsed');
  });
  // Vargas toggles
  $('#btn-toggle-vargas-n').addEventListener('click', () => toggleVargas('n'));
  $('#btn-toggle-vargas-s').addEventListener('click', () => toggleVargas('s'));
  // Zoom controls
  bindZoomControls();
  // Click-to-open modal for main charts + vargas
  bindChartModal();
}

// ---- Chart modal (click any chart to open at larger zoom) ----
function openChartModal(svgHtml, title) {
  $('#modal-title').textContent = title || '';
  $('#modal-chart').innerHTML = svgHtml;
  ZOOM_STATE['modal-chart'] = 1.0;
  updateZoom('modal-chart');
  $('#chart-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeChartModal() {
  $('#chart-modal').classList.add('hidden');
  $('#modal-chart').innerHTML = '';
  document.body.style.overflow = '';
}

function bindChartModal() {
  // Main charts — clicking anywhere in the wrap opens the modal
  const mainCharts = [
    { id: 'western-chart',  title: 'Western chart' },
    { id: 'vedic-n-chart',  title: 'Vedic — North Indian' },
    { id: 'vedic-s-chart',  title: 'Vedic — South Indian' }
  ];
  for (const mc of mainCharts) {
    const el = document.getElementById(mc.id);
    if (!el) continue;
    el.addEventListener('click', () => {
      const svg = el.querySelector('svg');
      if (!svg) return;
      // Clone SVG and strip any inline max-width set by zoom, so modal starts at 100%
      const clone = svg.cloneNode(true);
      clone.style.maxWidth = '';
      openChartModal(clone.outerHTML, mc.title);
    });
  }
  // Vargas — event delegation since they're lazy-rendered
  const vargaClickHandler = (e) => {
    const cell = e.target.closest('.varga-cell');
    if (!cell) return;
    const svg = cell.querySelector('svg');
    if (!svg) return;
    const id = cell.querySelector('.varga-id')?.textContent || '';
    const name = cell.querySelector('.varga-name')?.textContent || '';
    const clone = svg.cloneNode(true);
    clone.style.maxWidth = '';
    openChartModal(clone.outerHTML, `${id} — ${name}`);
  };
  $('#vargas-grid-n')?.addEventListener('click', vargaClickHandler);
  $('#vargas-grid-s')?.addEventListener('click', vargaClickHandler);
  // Close handlers
  $('#modal-close').addEventListener('click', closeChartModal);
  $('#modal-backdrop').addEventListener('click', closeChartModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#chart-modal').classList.contains('hidden')) {
      closeChartModal();
    }
  });
}

// ---- Zoom controls ----
const ZOOM_STATE = {}; // chartId -> zoom level (1.0 = 100%)

function bindZoomControls() {
  $$('.zoom-group').forEach(group => {
    const target = group.getAttribute('data-zoom-target');
    ZOOM_STATE[target] = 1.0;
    group.querySelector('.zoom-in').addEventListener('click', () => applyZoom(target, 0.15));
    group.querySelector('.zoom-out').addEventListener('click', () => applyZoom(target, -0.15));
    group.querySelector('.zoom-reset').addEventListener('click', () => { ZOOM_STATE[target] = 1.0; updateZoom(target); });
  });
}

function applyZoom(target, delta) {
  const cur = ZOOM_STATE[target] || 1.0;
  const next = Math.max(0.4, Math.min(3.0, cur + delta));
  ZOOM_STATE[target] = next;
  updateZoom(target);
}

function updateZoom(target) {
  const container = document.getElementById(target);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (svg) {
    // Base width differs: charts inside tabs default to 480px, modal to 800px.
    // Multiplying by the zoom level gives the effective max-width.
    const baseWidth = target === 'modal-chart' ? 800 : 480;
    svg.style.maxWidth = (baseWidth * ZOOM_STATE[target]) + 'px';
  }
  const group = document.querySelector(`.zoom-group[data-zoom-target="${target}"]`);
  if (group) {
    const pct = Math.round(ZOOM_STATE[target] * 100);
    group.querySelector('.zoom-label').textContent = pct + '%';
  }
}

// ---- Vargas toggle/render ----
let VARGAS_RENDERED = { n: false, s: false };
function toggleVargas(side) {
  if (!CURRENT_CHART) { alert('Calculate a chart first.'); return; }
  const panel = $('#vargas-panel-' + side);
  const btn = $('#btn-toggle-vargas-' + side);
  const wasHidden = panel.classList.contains('hidden');
  if (wasHidden && !VARGAS_RENDERED[side]) {
    $('#vargas-grid-' + side).innerHTML = renderAllVargas(CURRENT_CHART);
    VARGAS_RENDERED[side] = true;
  }
  panel.classList.toggle('hidden');
  btn.textContent = wasHidden ? 'Hide divisional charts ▴' : 'Show divisional charts ▾';
}

// ---- Copy prompt ----
function copyPromptHandler() {
  const text = $('#prompt-output').textContent;
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = $('#btn-copy-prompt');
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = orig, 1600);
    });
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function generatePromptHandler() {
  if (!CURRENT_CHART) { alert('Calculate a chart first.'); return; }
  const q = $('#user-question').value.trim();
  const opts = {
    western: $('#opt-western').checked,
    vedic: $('#opt-vedic').checked,
    dasha: $('#opt-dasha').checked,
    transits: $('#opt-transits').checked
  };
  const prompt = buildPrompt(CURRENT_CHART, q, opts);
  $('#prompt-output').textContent = prompt;
  $('#prompt-chars').textContent = prompt.length + ' characters · ~' + Math.round(prompt.length / 4) + ' tokens';
  $('#prompt-output-wrap').classList.remove('hidden');
}

// ---- Default form values (today, Hyderabad) ----
function setDefaultFormValues() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  if (!$('#dob').value) $('#dob').value = `${y}-${mo}-${d}`;
  if (!$('#tob').value || $('#tob').value === '12:00:00') $('#tob').value = `${hh}:${mm}:${ss}`;
  if (!$('#place-search').value) $('#place-search').value = 'Hyderabad, India';
  if (!$('#lat').value) $('#lat').value = 17.385;
  if (!$('#lon').value) $('#lon').value = 78.4867;
  if (!$('#tz').value || $('#tz').value === '5.5') $('#tz').value = 5.5;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  bindPlaceSearch();
  bindTabs();
  bindForm();
  setDefaultFormValues();
  if (typeof diaryBind === 'function') diaryBind();
});
