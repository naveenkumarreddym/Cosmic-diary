/* =============================================================
 * VIMSHOTTARI DASHA
 * 120-year cycle based on Moon's nakshatra at birth.
 * Order: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18,
 *        Jupiter 16, Saturn 19, Mercury 17 (years).
 * ============================================================= */

const DASHA_ORDER = [
  { lord: 'Ketu',    years: 7 },
  { lord: 'Venus',   years: 20 },
  { lord: 'Sun',     years: 6 },
  { lord: 'Moon',    years: 10 },
  { lord: 'Mars',    years: 7 },
  { lord: 'Rahu',    years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn',  years: 19 },
  { lord: 'Mercury', years: 17 }
];
const DASHA_TOTAL_YEARS = 120;
const MS_PER_YEAR = 365.25 * 86400 * 1000;

function dashaLordIndex(name) {
  return DASHA_ORDER.findIndex(d => d.lord === name);
}

// Given Moon's sidereal longitude (rad), compute starting dasha + balance.
// Returns { startLordIdx, balanceYears } where balance = years remaining in birth dasha.
function dashaStartFromMoon(moonSidLon) {
  const nak = longitudeToNakshatra(moonSidLon);
  const lordIdx = dashaLordIndex(nak.lord);
  const nakSize = 360 / 27; // degrees
  const degInNak = nak.degInNak;
  const fractionElapsed = degInNak / nakSize;
  const fullYears = DASHA_ORDER[lordIdx].years;
  const balanceYears = fullYears * (1 - fractionElapsed);
  return { startLordIdx: lordIdx, balanceYears, fractionElapsed };
}

// Build Mahadashas from birth forward. The sequence repeats every 120 years
// (same 9 lords in the same Ketu→Venus→Sun→Moon→Mars→Rahu→Jupiter→Saturn→Mercury
// order), so we keep appending full cycles until we've covered `minEndJD`.
// If minEndJD isn't provided, default to birth + 120 years (one complete cycle
// beyond the partial birth dasha).
function buildMahadashaSequence(birthJD, moonSidLon, minEndJD) {
  const { startLordIdx, balanceYears } = dashaStartFromMoon(moonSidLon);
  const seq = [];
  let currentJD = birthJD;
  // First dasha — shortened to the balance at birth
  {
    const d = DASHA_ORDER[startLordIdx];
    const years = balanceYears;
    const endJD = currentJD + years * 365.25;
    seq.push({
      lord: d.lord,
      years,
      fullYears: d.years,
      startJD: currentJD,
      endJD,
      startDate: julianDayToDate(currentJD),
      endDate: julianDayToDate(endJD)
    });
    currentJD = endJD;
  }
  // Target: run until minEndJD OR at least one full 120-year cycle after the
  // partial birth dasha, whichever is further. Add a 1-cycle buffer so the
  // caller's target date isn't at the very edge of the sequence.
  const oneCycle = DASHA_TOTAL_YEARS * 365.25;
  const target = Math.max(
    (minEndJD || 0) + oneCycle,
    birthJD + oneCycle * 1.5       // always cover at least birth + 180 years
  );
  // Safety cap: prevent pathological infinite loops
  const hardCap = birthJD + 10 * oneCycle;  // 1200 years max
  let idx = (startLordIdx + 1) % 9;
  while (currentJD < target && currentJD < hardCap) {
    const d = DASHA_ORDER[idx];
    const endJD = currentJD + d.years * 365.25;
    seq.push({
      lord: d.lord,
      years: d.years,
      fullYears: d.years,
      startJD: currentJD,
      endJD,
      startDate: julianDayToDate(currentJD),
      endDate: julianDayToDate(endJD)
    });
    currentJD = endJD;
    idx = (idx + 1) % 9;
  }
  return seq;
}

// Build Antardasha (bhukti) sequence within a given Mahadasha
function buildAntardasha(maha) {
  const seq = [];
  let currentJD = maha.startJD;
  const lordIdx = dashaLordIndex(maha.lord);
  // The Mahadasha might be shortened (first one after birth)
  // Antardashas scale proportionally.
  const scaleFactor = maha.years / maha.fullYears;
  for (let i = 0; i < 9; i++) {
    const subLord = DASHA_ORDER[(lordIdx + i) % 9];
    const subYearsFull = (maha.fullYears * subLord.years) / DASHA_TOTAL_YEARS;
    const subYears = subYearsFull * scaleFactor;
    // For the first Mahadasha, the antardasha may start mid-way
    const endJD = currentJD + subYears * 365.25;
    seq.push({
      lord: subLord.lord,
      years: subYears,
      fullYears: subYearsFull,
      startJD: currentJD,
      endJD,
      startDate: julianDayToDate(currentJD),
      endDate: julianDayToDate(endJD)
    });
    currentJD = endJD;
  }
  return seq;
}

// More accurate: antardasha for the FIRST (birth) mahadasha must account for
// the fractional elapsed time at birth — the antardashas start not from sequence
// beginning but from wherever the clock was at birth.
function buildFirstMahadashaAntardasha(maha, fractionElapsed) {
  const seq = [];
  const lordIdx = dashaLordIndex(maha.lord);
  // Full-length antardashas of this mahadasha:
  const fullAntardashas = [];
  let cumul = 0;
  for (let i = 0; i < 9; i++) {
    const subLord = DASHA_ORDER[(lordIdx + i) % 9];
    const subYears = (maha.fullYears * subLord.years) / DASHA_TOTAL_YEARS;
    fullAntardashas.push({ lord: subLord.lord, years: subYears, cumulStart: cumul });
    cumul += subYears;
  }
  // At birth, elapsed in this mahadasha = fractionElapsed × fullYears
  const elapsedYears = fractionElapsed * maha.fullYears;
  // Find which antardasha we're in at birth
  let startIdx = 0;
  for (let i = 0; i < 9; i++) {
    if (elapsedYears < fullAntardashas[i].cumulStart + fullAntardashas[i].years) {
      startIdx = i;
      break;
    }
  }
  // Balance of current antardasha at birth
  const elapsedInCurrent = elapsedYears - fullAntardashas[startIdx].cumulStart;
  const balanceCurrent = fullAntardashas[startIdx].years - elapsedInCurrent;
  let currentJD = maha.startJD;
  // First (balance) antardasha
  {
    const endJD = currentJD + balanceCurrent * 365.25;
    seq.push({
      lord: fullAntardashas[startIdx].lord,
      years: balanceCurrent,
      fullYears: fullAntardashas[startIdx].years,
      startJD: currentJD,
      endJD,
      startDate: julianDayToDate(currentJD),
      endDate: julianDayToDate(endJD)
    });
    currentJD = endJD;
  }
  // Remaining antardashas
  for (let i = 1; i < 9; i++) {
    const idx2 = (startIdx + i) % 9;
    const ad = fullAntardashas[idx2];
    const endJD = currentJD + ad.years * 365.25;
    seq.push({
      lord: ad.lord,
      years: ad.years,
      fullYears: ad.years,
      startJD: currentJD,
      endJD,
      startDate: julianDayToDate(currentJD),
      endDate: julianDayToDate(endJD)
    });
    currentJD = endJD;
  }
  return seq;
}

// Pratyantar dasha sub-sub-division within an antardasha
function buildPratyantar(antar) {
  const seq = [];
  let currentJD = antar.startJD;
  const lordIdx = dashaLordIndex(antar.lord);
  for (let i = 0; i < 9; i++) {
    const subLord = DASHA_ORDER[(lordIdx + i) % 9];
    const subYears = (antar.years * subLord.years) / DASHA_TOTAL_YEARS;
    const endJD = currentJD + subYears * 365.25;
    seq.push({
      lord: subLord.lord,
      years: subYears,
      startJD: currentJD,
      endJD,
      startDate: julianDayToDate(currentJD),
      endDate: julianDayToDate(endJD)
    });
    currentJD = endJD;
  }
  return seq;
}

// Find current dasha hierarchy at a given date
function findCurrentDasha(chart, targetJD) {
  const moonLon = chart.sidereal.moon.lon;
  const { fractionElapsed } = dashaStartFromMoon(moonLon);
  const maha = buildMahadashaSequence(chart.jdUT, moonLon, targetJD);
  // Find active mahadasha
  let currentMaha = null, mahaIdx = -1;
  for (let i = 0; i < maha.length; i++) {
    if (targetJD >= maha[i].startJD && targetJD < maha[i].endJD) {
      currentMaha = maha[i];
      mahaIdx = i;
      break;
    }
  }
  if (!currentMaha) return { maha, current: null };
  // Antardasha within current mahadasha
  let antar;
  if (mahaIdx === 0) {
    antar = buildFirstMahadashaAntardasha(currentMaha, fractionElapsed);
  } else {
    antar = buildAntardasha(currentMaha);
  }
  let currentAntar = null, antarIdx = -1;
  for (let i = 0; i < antar.length; i++) {
    if (targetJD >= antar[i].startJD && targetJD < antar[i].endJD) {
      currentAntar = antar[i];
      antarIdx = i;
      break;
    }
  }
  // Pratyantar
  let praty = null, currentPraty = null;
  if (currentAntar) {
    praty = buildPratyantar(currentAntar);
    for (const p of praty) {
      if (targetJD >= p.startJD && targetJD < p.endJD) {
        currentPraty = p;
        break;
      }
    }
  }
  return {
    maha,
    antar,
    praty,
    currentMaha,
    currentAntar,
    currentPraty
  };
}
