/* =============================================================
 * AI PROMPT GENERATOR
 * Builds a comprehensive markdown prompt that a user can paste
 * into any LLM (ChatGPT, Claude, Gemini, Grok, local Llama, etc.)
 * to get astrological interpretations of their question.
 * ============================================================= */

function buildPrompt(chart, userQuestion, opts) {
  const input = chart.input;
  const bornDate = `${input.year}-${String(input.month).padStart(2,'0')}-${String(input.day).padStart(2,'0')}`;
  const bornTime = `${String(input.hour).padStart(2,'0')}:${String(input.minute).padStart(2,'0')}:${String(input.second).padStart(2,'0')}`;
  const tzStr = `UTC${input.tzHours >= 0 ? '+' : ''}${input.tzHours}`;
  const nowJD = dateToJD(new Date());
  const now = new Date();
  const nowStr = now.toISOString().substring(0, 10);

  let out = '';
  out += '# Astrological Consultation Request\n\n';
  out += 'You are a knowledgeable astrologer combining Western tropical and Vedic (Jyotish) sidereal traditions. ';
  out += 'Below is the native\'s chart data, computed with Swiss Ephemeris-equivalent algorithms (VSOP87 + truncated ELP2000). ';
  out += 'Please interpret the chart in relation to the question at the end. Use both Western psychological symbolism and Vedic karmic/timing frameworks where relevant. ';
  out += 'Be specific, grounded, and avoid generic fortune-cookie statements. If a prediction involves timing, cite the specific dasha or transit window.\n\n';

  out += '---\n\n';
  out += '## Birth Data\n\n';
  out += `- **Name:** ${input.name || 'Anonymous'}\n`;
  out += `- **Date of birth:** ${bornDate}\n`;
  out += `- **Time of birth:** ${bornTime} (${tzStr})\n`;
  out += `- **Location:** ${input.latDeg.toFixed(4)}°, ${input.lonDeg.toFixed(4)}°\n`;
  out += `- **Ayanamsa used:** ${input.ayanamsaKind === 'lahiri' ? 'Lahiri (Chitrapaksha)' : 'Pushya Paksha'} = ${chart.ayanamsaDeg.toFixed(4)}°\n`;
  out += `- **House system (Western):** ${input.houseSystem === 'placidus' ? 'Placidus' : input.houseSystem === 'koch' ? 'Koch' : 'Whole Sign'}\n`;
  out += `- **Node type:** ${input.useTrueNode ? 'True Node' : 'Mean Node'}\n\n`;

  // Vedic highlights (always included as anchor)
  const asc = chart.vedic.ascSign;
  const moonNak = chart.positions.moon.nakshatra;
  out += '## Key Anchors\n\n';
  out += `- **Vedic Lagna (Ascendant, sidereal):** ${asc.sign} ${asc.formatted}\n`;
  out += `- **Moon sign (Rashi, sidereal):** ${chart.positions.moon.sidSign.sign}\n`;
  out += `- **Moon Nakshatra:** ${moonNak.nakshatra} — pada ${moonNak.pada} — ruling lord: ${moonNak.lord}\n`;
  out += `- **Sun sign (tropical / Western):** ${chart.positions.sun.tropSign.sign}\n`;
  out += `- **Sun sign (sidereal / Vedic):** ${chart.positions.sun.sidSign.sign}\n\n`;

  // Western positions
  if (opts.western) {
    out += '## Western Tropical Chart\n\n';
    out += `- Ascendant: ${formatLongitude(chart.houses.asc)}\n`;
    out += `- Midheaven (MC): ${formatLongitude(chart.houses.mc)}\n\n`;
    out += '### Planets (tropical, geocentric)\n\n';
    out += '| Planet | Sign | Degree | House | Motion |\n';
    out += '|---|---|---|---|---|\n';
    for (const k of PLANET_ORDER) {
      const p = chart.positions[k];
      out += `| ${p.name} | ${p.tropSign.sign} | ${p.tropSign.formatted} | ${p.westHouse} | ${p.retrograde ? 'Retrograde' : 'Direct'} |\n`;
    }
    out += '\n### House cusps (Western)\n\n';
    for (let h = 0; h < 12; h++) {
      out += `- H${h + 1}: ${formatLongitude(chart.houses.cusps[h])}\n`;
    }
    out += '\n### Major aspects (tropical, tight orbs)\n\n';
    if (chart.aspects.length === 0) {
      out += '_No major aspects within standard orbs._\n\n';
    } else {
      for (const a of chart.aspects) {
        out += `- ${PLANET_INFO[a.p1].name} ${a.aspect} ${PLANET_INFO[a.p2].name} (orb ${a.orb.toFixed(1)}°)${a.exact ? ' — exact' : ''}\n`;
      }
      out += '\n';
    }
  }

  // Vedic / Sidereal positions
  if (opts.vedic) {
    out += '## Vedic Sidereal Chart (Jyotish)\n\n';
    out += `- Lagna (sidereal Ascendant): ${asc.sign} ${asc.formatted}\n`;
    out += `- Moon's sign (Janma Rashi): ${chart.positions.moon.sidSign.sign}\n`;
    out += `- Moon's Nakshatra: ${moonNak.nakshatra} (pada ${moonNak.pada}, lord: ${moonNak.lord})\n\n`;
    out += '### Planets (sidereal, with nakshatra & whole-sign house from Lagna)\n\n';
    out += '| Planet | Rashi | Degree | Nakshatra (Lord) | Pada | House | Motion |\n';
    out += '|---|---|---|---|---|---|---|\n';
    for (const k of PLANET_ORDER) {
      const p = chart.positions[k];
      out += `| ${p.name} | ${p.sidSign.sign} | ${p.sidSign.formatted} | ${p.nakshatra.nakshatra} (${p.nakshatra.lord}) | ${p.nakshatra.pada} | H${p.vedicHouse} | ${p.retrograde ? 'Retro' : 'Direct'} |\n`;
    }
    out += '\n';
  }

  // Dasha
  if (opts.dasha) {
    const moonSidLon = chart.sidereal.moon.lon;
    const dashaInfo = findCurrentDasha(chart, nowJD);
    out += '## Vimshottari Dasha (120-year planetary periods)\n\n';
    if (dashaInfo.currentMaha) {
      out += `**Currently running (as of ${nowStr}):**\n`;
      out += `- **Mahādaśā:** ${dashaInfo.currentMaha.lord} (${formatDate(dashaInfo.currentMaha.startDate)} → ${formatDate(dashaInfo.currentMaha.endDate)})\n`;
      if (dashaInfo.currentAntar) {
        out += `- **Antardaśā:** ${dashaInfo.currentAntar.lord} (${formatDate(dashaInfo.currentAntar.startDate)} → ${formatDate(dashaInfo.currentAntar.endDate)})\n`;
      }
      if (dashaInfo.currentPraty) {
        out += `- **Pratyantar:** ${dashaInfo.currentPraty.lord} (${formatDate(dashaInfo.currentPraty.startDate)} → ${formatDate(dashaInfo.currentPraty.endDate)})\n`;
      }
      out += '\n';
    }
    out += '### Full Mahādaśā sequence from birth\n\n';
    out += '| # | Lord | Start | End | Years |\n|---|---|---|---|---|\n';
    dashaInfo.maha.forEach((m, i) => {
      out += `| ${i + 1} | ${m.lord} | ${formatDate(m.startDate)} | ${formatDate(m.endDate)} | ${m.years.toFixed(2)} |\n`;
    });
    out += '\n';
    if (dashaInfo.antar && dashaInfo.currentMaha) {
      out += `### Antardaśās within ${dashaInfo.currentMaha.lord} Mahā\n\n`;
      out += '| Lord | Start | End | Years |\n|---|---|---|---|\n';
      for (const a of dashaInfo.antar) {
        out += `| ${a.lord} | ${formatDate(a.startDate)} | ${formatDate(a.endDate)} | ${a.years.toFixed(2)} |\n`;
      }
      out += '\n';
    }
  }

  // Current transits
  if (opts.transits) {
    out += `## Current Transits (${nowStr})\n\n`;
    const tr = computeTransitPositions(
      now.getFullYear(), now.getMonth() + 1, now.getDate(),
      now.getHours(), now.getMinutes(),
      input.ayanamsaKind, input.useTrueNode, input.tzHours
    );
    out += '### Transit planet positions\n\n';
    out += '| Planet | Tropical | Sidereal | Motion |\n|---|---|---|---|\n';
    for (const k of PLANET_ORDER) {
      if (!tr.tropical[k]) continue;
      const trop = longitudeToSign(tr.tropical[k].lon);
      const sid = longitudeToSign(tr.sidereal[k].lon);
      out += `| ${PLANET_INFO[k].name} | ${trop.sign} ${trop.formatted} | ${sid.sign} ${sid.formatted} | ${tr.tropical[k].retrograde ? 'Retro' : 'Direct'} |\n`;
    }
    out += '\n';
    const tAspects = transitAspectsToNatal(tr, chart.positions);
    if (tAspects.length > 0) {
      out += '### Active transit aspects to natal planets\n\n';
      for (const a of tAspects) {
        out += `- **Transit ${PLANET_INFO[a.transitPlanet].name}** ${a.aspect} **natal ${PLANET_INFO[a.natalPlanet].name}** (orb ${a.orb.toFixed(1)}°)\n`;
      }
      out += '\n';
    }
    // Sade Sati check
    const natalMoonSign = chart.positions.moon.sidSign.signIdx;
    const tSatSign = Math.floor(mod360(tr.sidereal.saturn.lon * RAD) / 30);
    const distFromMoon = (tSatSign - natalMoonSign + 12) % 12;
    if (distFromMoon === 11 || distFromMoon === 0 || distFromMoon === 1) {
      out += `**Note:** Saturn is currently ${distFromMoon === 11 ? 'in the 12th from' : distFromMoon === 0 ? 'conjunct' : 'in the 2nd from'} natal Moon sign (${chart.positions.moon.sidSign.sign}). Native is currently in **Sade Sati**.\n\n`;
    }
  }

  // The question
  out += '---\n\n';
  out += '## Question\n\n';
  if (userQuestion) {
    out += `> ${userQuestion}\n\n`;
  } else {
    out += '> _(No specific question provided — please give a general life reading covering career, relationships, health, and spiritual path, with timing guidance from the current dasha and transits.)_\n\n';
  }

  // Interpretation guidance
  out += '## Interpretation Guidance\n\n';
  out += 'Please structure your response as follows:\n\n';
  out += '1. **Core chart synthesis (2-3 paragraphs):** Identify the native\'s dominant energies. Integrate Western (psychological archetype, aspect patterns) and Vedic (Lagna lord, Moon nakshatra, key yogas) views.\n';
  out += '2. **Direct answer to the question:** Address the question specifically, citing the relevant planets, houses, signs, and current period.\n';
  out += '3. **Timing (if relevant):** Identify favorable and challenging windows based on the current/upcoming dasha, antardasha, and slow-moving transits (Saturn, Jupiter, Rahu/Ketu).\n';
  out += '4. **Remedies or suggestions:** Practical, ethical guidance. Avoid fatalism; frame challenges as growth opportunities.\n\n';
  out += 'If a date range is given (e.g., through 2030), structure timing predictions chronologically. Cross-check Vedic dasha timing against Western transits when they align — such confluences are the most reliable.\n\n';
  out += '_Note: Chart data was computed offline using standard astronomical algorithms (VSOP87D truncated + Meeus lunar theory). Planetary positions should be accurate to within a few arcminutes over 369 CE – 3369 CE. If you (the LLM) spot obvious inconsistencies, flag them rather than silently correcting._\n';

  return out;
}
