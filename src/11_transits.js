/* =============================================================
 * TRANSITS & EVENTS
 * ============================================================= */

// Compute transit planet positions at arbitrary date (local time)
function computeTransitPositions(year, month, day, hour, minute, ayanamsaKind, useTrueNode, tzHours) {
  const jd = localToJD(year, month, day, hour, minute, 0, tzHours);
  const jde = jdToJDE(jd, year, month);
  const tropical = {};
  for (const p of ['sun','mercury','venus','mars','jupiter','saturn','uranus','neptune']) {
    tropical[p] = planetGeocentric(p, jde);
    tropical[p].retrograde = isRetrograde(p, jde);
  }
  tropical.moon = moonPosition(jde);
  tropical.moon.retrograde = false;
  const nodes = rahuKetu(jde, useTrueNode);
  tropical.rahu = { ...nodes.rahu, retrograde: true };
  tropical.ketu = { ...nodes.ketu, retrograde: true };
  const ay = ayanamsa(jde, ayanamsaKind) * DEG;
  const sidereal = {};
  for (const k of Object.keys(tropical)) {
    sidereal[k] = {
      lon: mod2pi(tropical[k].lon - ay),
      retrograde: tropical[k].retrograde
    };
  }
  return { jd, jde, tropical, sidereal, ayanamsaDeg: ay * RAD };
}

// Transit aspects against natal positions
function transitAspectsToNatal(transit, natalPositions) {
  const asp = [];
  const majorAspects = [
    { name: 'Conjunction', angle: 0, orb: 4 },
    { name: 'Sextile', angle: 60, orb: 3 },
    { name: 'Square', angle: 90, orb: 3 },
    { name: 'Trine', angle: 120, orb: 3 },
    { name: 'Opposition', angle: 180, orb: 4 }
  ];
  for (const tp of PLANET_ORDER) {
    if (!transit.tropical[tp]) continue;
    const tLon = transit.tropical[tp].lon * RAD;
    for (const np of PLANET_ORDER) {
      if (!natalPositions[np]) continue;
      const nLon = natalPositions[np].tropical * RAD;
      let diff = Math.abs(tLon - nLon);
      if (diff > 180) diff = 360 - diff;
      for (const a of majorAspects) {
        const delta = Math.abs(diff - a.angle);
        if (delta <= a.orb) {
          asp.push({
            transitPlanet: tp,
            natalPlanet: np,
            aspect: a.name,
            orb: delta
          });
          break;
        }
      }
    }
  }
  return asp;
}

// Scan a date range for significant events
function scanEvents(chart, fromJD, toJD, ayanamsaKind, useTrueNode, tzHours) {
  const events = [];
  const natalMoonSid = chart.sidereal.moon.lon * RAD;
  const natalMoonSign = Math.floor(mod360(natalMoonSid) / 30);
  const natalJD = chart.jdUT;
  // Sample at ~monthly intervals for slow phenomena
  const stepDays = 10;
  let prevSaturnSign = null, prevJupiterSign = null, prevRahuSign = null;
  let sadeSatiStart = null;
  for (let jd = fromJD; jd <= toJD; jd += stepDays) {
    const d = julianDayToDate(jd);
    const t = computeTransitPositions(d.year, d.month, Math.floor(d.day), 12, 0, ayanamsaKind, useTrueNode, tzHours);
    // Saturn sidereal sign
    const satSign = Math.floor(mod360(t.sidereal.saturn.lon * RAD) / 30);
    const jupSign = Math.floor(mod360(t.sidereal.jupiter.lon * RAD) / 30);
    const rahuSign = Math.floor(mod360(t.sidereal.rahu.lon * RAD) / 30);
    // Saturn sign change
    if (prevSaturnSign !== null && satSign !== prevSaturnSign) {
      events.push({
        jd,
        date: formatDate(d),
        type: 'saturn-transit',
        title: `Saturn enters ${SIGNS[satSign].name}`,
        desc: `Saturn transits from ${SIGNS[prevSaturnSign].name} into ${SIGNS[satSign].name}`
      });
    }
    // Jupiter sign change (approx yearly)
    if (prevJupiterSign !== null && jupSign !== prevJupiterSign) {
      events.push({
        jd,
        date: formatDate(d),
        type: 'jupiter-transit',
        title: `Jupiter enters ${SIGNS[jupSign].name}`,
        desc: `Jupiter transits into ${SIGNS[jupSign].name}`
      });
    }
    // Rahu sign change (~18 months)
    if (prevRahuSign !== null && rahuSign !== prevRahuSign) {
      events.push({
        jd,
        date: formatDate(d),
        type: 'rahu-transit',
        title: `Rahu enters ${SIGNS[rahuSign].name}`,
        desc: `Rahu–Ketu axis shifts to ${SIGNS[rahuSign].name} / ${SIGNS[(rahuSign+6)%12].name}`
      });
    }
    // Sade Sati: Saturn in 12th, 1st, or 2nd from natal Moon sign
    const distFromMoon = (satSign - natalMoonSign + 12) % 12;
    const isSadeSati = (distFromMoon === 11 || distFromMoon === 0 || distFromMoon === 1);
    if (isSadeSati && sadeSatiStart === null) {
      sadeSatiStart = { jd, d };
    } else if (!isSadeSati && sadeSatiStart !== null) {
      events.push({
        jd: sadeSatiStart.jd,
        date: formatDate(sadeSatiStart.d),
        type: 'sade-sati-start',
        title: 'Sade Sati begins',
        desc: `Saturn enters 12th house from natal Moon (${SIGNS[natalMoonSign].name}). ~7.5 year period.`
      });
      events.push({
        jd,
        date: formatDate(d),
        type: 'sade-sati-end',
        title: 'Sade Sati ends',
        desc: `Saturn exits 2nd house from natal Moon, completing Sade Sati cycle.`
      });
      sadeSatiStart = null;
    }
    prevSaturnSign = satSign;
    prevJupiterSign = jupSign;
    prevRahuSign = rahuSign;
  }
  // Jupiter return (~every 12 years): Jupiter returns to natal tropical position
  const natalJup = chart.tropical.jupiter.lon * RAD;
  const natalSat = chart.tropical.saturn.lon * RAD;
  const yearsFromBirth = (fromJD - natalJD) / 365.25;
  const toYears = (toJD - natalJD) / 365.25;
  // Estimate Jupiter return years: ~11.86 yr cycle
  const jupPeriod = 4332.59 / 365.25; // years
  for (let n = Math.max(1, Math.floor(yearsFromBirth / jupPeriod));
           n <= Math.ceil(toYears / jupPeriod); n++) {
    const approxJD = natalJD + n * jupPeriod * 365.25;
    if (approxJD < fromJD || approxJD > toJD) continue;
    // Find exact return by checking a few nearby dates
    const exactJD = findReturnJD('jupiter', natalJup, approxJD, 365);
    if (exactJD) {
      const d = julianDayToDate(exactJD);
      events.push({
        jd: exactJD,
        date: formatDate(d),
        type: 'jupiter-return',
        title: `Jupiter Return #${n}`,
        desc: `Jupiter returns to its natal position. Age ~${Math.round(n * 11.86)}.`
      });
    }
  }
  // Saturn return (~every 29.46 years)
  const satPeriod = 10759.22 / 365.25;
  for (let n = Math.max(1, Math.floor(yearsFromBirth / satPeriod));
           n <= Math.ceil(toYears / satPeriod); n++) {
    const approxJD = natalJD + n * satPeriod * 365.25;
    if (approxJD < fromJD || approxJD > toJD) continue;
    const exactJD = findReturnJD('saturn', natalSat, approxJD, 730);
    if (exactJD) {
      const d = julianDayToDate(exactJD);
      events.push({
        jd: exactJD,
        date: formatDate(d),
        type: 'saturn-return',
        title: `Saturn Return #${n}`,
        desc: `Saturn returns to natal position. Age ~${Math.round(n * 29.46)}. Major life milestone.`
      });
    }
  }
  // Sort events by date
  events.sort((a, b) => a.jd - b.jd);
  return events;
}

// Find exact JD when a planet returns to a target longitude (radians of tropical at that date)
function findReturnJD(planet, targetLonRad, approxJD, windowDays) {
  const targetDeg = mod360(targetLonRad * RAD);
  // Binary-search style: sample coarse, then refine
  const step = 1;
  let bestJD = null, bestDiff = 360;
  for (let jd = approxJD - windowDays; jd <= approxJD + windowDays; jd += step) {
    const d = julianDayToDate(jd);
    const jde = jdToJDE(jd, d.year, d.month);
    const p = planetGeocentric(planet, jde);
    let diff = Math.abs(mod360(p.lon * RAD) - targetDeg);
    if (diff > 180) diff = 360 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      bestJD = jd;
    }
  }
  return bestJD;
}

function formatDate(d) {
  return `${d.year}-${String(d.month).padStart(2,'0')}-${String(Math.floor(d.day)).padStart(2,'0')}`;
}
