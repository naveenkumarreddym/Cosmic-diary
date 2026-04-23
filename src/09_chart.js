/* =============================================================
 * CHART DATA ASSEMBLY
 * - Signs, Nakshatras, Planet info
 * - Main function: buildChart(input) returns full chart object
 * ============================================================= */

const SIGNS = [
  { name: 'Aries',       glyph: '♈', element: 'Fire',  quality: 'Cardinal', lord: 'Mars' },
  { name: 'Taurus',      glyph: '♉', element: 'Earth', quality: 'Fixed',    lord: 'Venus' },
  { name: 'Gemini',      glyph: '♊', element: 'Air',   quality: 'Mutable',  lord: 'Mercury' },
  { name: 'Cancer',      glyph: '♋', element: 'Water', quality: 'Cardinal', lord: 'Moon' },
  { name: 'Leo',         glyph: '♌', element: 'Fire',  quality: 'Fixed',    lord: 'Sun' },
  { name: 'Virgo',       glyph: '♍', element: 'Earth', quality: 'Mutable',  lord: 'Mercury' },
  { name: 'Libra',       glyph: '♎', element: 'Air',   quality: 'Cardinal', lord: 'Venus' },
  { name: 'Scorpio',     glyph: '♏', element: 'Water', quality: 'Fixed',    lord: 'Mars' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire',  quality: 'Mutable',  lord: 'Jupiter' },
  { name: 'Capricorn',   glyph: '♑', element: 'Earth', quality: 'Cardinal', lord: 'Saturn' },
  { name: 'Aquarius',    glyph: '♒', element: 'Air',   quality: 'Fixed',    lord: 'Saturn' },
  { name: 'Pisces',      glyph: '♓', element: 'Water', quality: 'Mutable',  lord: 'Jupiter' }
];

// 27 nakshatras with their lords (Vimshottari order: Ketu Venus Sun Moon Mars Rahu Jupiter Saturn Mercury × 3)
const NAKSHATRAS = [
  { name: 'Ashwini',       lord: 'Ketu' },
  { name: 'Bharani',       lord: 'Venus' },
  { name: 'Krittika',      lord: 'Sun' },
  { name: 'Rohini',        lord: 'Moon' },
  { name: 'Mrigashira',    lord: 'Mars' },
  { name: 'Ardra',         lord: 'Rahu' },
  { name: 'Punarvasu',     lord: 'Jupiter' },
  { name: 'Pushya',        lord: 'Saturn' },
  { name: 'Ashlesha',      lord: 'Mercury' },
  { name: 'Magha',         lord: 'Ketu' },
  { name: 'Purva Phalguni',lord: 'Venus' },
  { name: 'Uttara Phalguni',lord:'Sun' },
  { name: 'Hasta',         lord: 'Moon' },
  { name: 'Chitra',        lord: 'Mars' },
  { name: 'Swati',         lord: 'Rahu' },
  { name: 'Vishakha',      lord: 'Jupiter' },
  { name: 'Anuradha',      lord: 'Saturn' },
  { name: 'Jyeshtha',      lord: 'Mercury' },
  { name: 'Mula',          lord: 'Ketu' },
  { name: 'Purva Ashadha', lord: 'Venus' },
  { name: 'Uttara Ashadha',lord: 'Sun' },
  { name: 'Shravana',      lord: 'Moon' },
  { name: 'Dhanishta',     lord: 'Mars' },
  { name: 'Shatabhisha',   lord: 'Rahu' },
  { name: 'Purva Bhadrapada',lord:'Jupiter' },
  { name: 'Uttara Bhadrapada',lord:'Saturn' },
  { name: 'Revati',        lord: 'Mercury' }
];

const PLANET_ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','rahu','ketu'];

const PLANET_INFO = {
  sun:     { name: 'Sun',     glyph: '☉', abbr: 'Su', vedic: true,  western: true },
  moon:    { name: 'Moon',    glyph: '☽', abbr: 'Mo', vedic: true,  western: true },
  mercury: { name: 'Mercury', glyph: '☿', abbr: 'Me', vedic: true,  western: true },
  venus:   { name: 'Venus',   glyph: '♀', abbr: 'Ve', vedic: true,  western: true },
  mars:    { name: 'Mars',    glyph: '♂', abbr: 'Ma', vedic: true,  western: true },
  jupiter: { name: 'Jupiter', glyph: '♃', abbr: 'Ju', vedic: true,  western: true },
  saturn:  { name: 'Saturn',  glyph: '♄', abbr: 'Sa', vedic: true,  western: true },
  uranus:  { name: 'Uranus',  glyph: '♅', abbr: 'Ur', vedic: false, western: true },
  neptune: { name: 'Neptune', glyph: '♆', abbr: 'Ne', vedic: false, western: true },
  rahu:    { name: 'Rahu',    glyph: '☊', abbr: 'Ra', vedic: true,  western: true },
  ketu:    { name: 'Ketu',    glyph: '☋', abbr: 'Ke', vedic: true,  western: true }
};

// Compute sign + degree-within-sign for a longitude (rad)
function longitudeToSign(lon) {
  const deg = mod360(lon * RAD);
  const signIdx = Math.floor(deg / 30);
  const degInSign = deg - signIdx * 30;
  return {
    signIdx,
    sign: SIGNS[signIdx].name,
    signGlyph: SIGNS[signIdx].glyph,
    degInSign,
    formatted: formatDegInSign(degInSign)
  };
}

// Nakshatra + pada from sidereal longitude (rad)
function longitudeToNakshatra(sidLon) {
  const deg = mod360(sidLon * RAD);
  // Each nakshatra = 360/27 = 13.333...°, each pada = 3.333...°
  const nakIdx = Math.floor(deg / (360 / 27));
  const degInNak = deg - nakIdx * (360 / 27);
  const pada = Math.floor(degInNak / (360 / 108)) + 1;
  const degInPada = degInNak - (pada - 1) * (360 / 108);
  return {
    nakIdx,
    nakshatra: NAKSHATRAS[nakIdx].name,
    lord: NAKSHATRAS[nakIdx].lord,
    pada,
    degInNak,
    degInPada
  };
}

function formatDegInSign(d) {
  const deg = Math.floor(d);
  const minF = (d - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.round((minF - min) * 60);
  return `${deg}° ${String(min).padStart(2,'0')}′ ${String(sec).padStart(2,'0')}″`;
}

function formatLongitude(lon) {
  const info = longitudeToSign(lon);
  return `${info.formatted} ${info.signGlyph} ${info.sign}`;
}

// Aspects (Western) — conjunction/sextile/square/trine/opposition
const ASPECTS = [
  { name: 'Conjunction', angle: 0,   orb: 8, symbol: '☌' },
  { name: 'Sextile',     angle: 60,  orb: 6, symbol: '✶' },
  { name: 'Square',      angle: 90,  orb: 7, symbol: '□' },
  { name: 'Trine',       angle: 120, orb: 8, symbol: '△' },
  { name: 'Opposition',  angle: 180, orb: 8, symbol: '☍' }
];

function findAspects(positions) {
  const aspects = [];
  const keys = Object.keys(positions).filter(k => positions[k] && !isNaN(positions[k].lon));
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = positions[keys[i]].lon * RAD;
      const b = positions[keys[j]].lon * RAD;
      let diff = Math.abs(a - b);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS) {
        const delta = Math.abs(diff - asp.angle);
        if (delta <= asp.orb) {
          aspects.push({
            p1: keys[i], p2: keys[j],
            aspect: asp.name,
            symbol: asp.symbol,
            orb: delta,
            exact: delta < 1
          });
          break;
        }
      }
    }
  }
  return aspects;
}

// Build complete chart from inputs.
// input: {year, month, day, hour, minute, second, tzHours, latDeg, lonDeg, ayanamsaKind, houseSystem, useTrueNode}
function buildChart(input) {
  const { year, month, day, hour, minute, second, tzHours, latDeg, lonDeg,
          ayanamsaKind, houseSystem, useTrueNode } = input;
  // Julian Day (UT)
  const jdUT = localToJD(year, month, day, hour, minute, second, tzHours);
  const jde = jdToJDE(jdUT, year, month);
  const T = (jde - J2000) / 36525;
  const latRad = latDeg * DEG;
  const lonRad = lonDeg * DEG;
  // Compute tropical geocentric longitudes for all bodies
  const tropical = {};
  for (const planet of ['sun','mercury','venus','mars','jupiter','saturn','uranus','neptune']) {
    tropical[planet] = planetGeocentric(planet, jde);
    tropical[planet].retrograde = isRetrograde(planet, jde);
  }
  tropical.moon = moonPosition(jde);
  tropical.moon.retrograde = false;
  const nodes = rahuKetu(jde, useTrueNode);
  tropical.rahu = { ...nodes.rahu, retrograde: true };
  tropical.ketu = { ...nodes.ketu, retrograde: true };
  // Sidereal longitudes
  const ay = ayanamsa(jde, ayanamsaKind) * DEG;
  const sidereal = {};
  for (const k of Object.keys(tropical)) {
    sidereal[k] = {
      lon: mod2pi(tropical[k].lon - ay),
      lat: tropical[k].lat,
      r: tropical[k].r,
      retrograde: tropical[k].retrograde
    };
  }
  // Houses (Western, tropical)
  const houses = calculateHouses(houseSystem, jdUT, latRad, lonRad);
  // Sidereal ASC/MC for Vedic
  const sidAsc = mod2pi(houses.asc - ay);
  const sidMc = mod2pi(houses.mc - ay);
  // Vedic uses whole-sign houses from sidereal ASC
  const vedicHouses = housesWholeSign(sidAsc);
  // Assemble positions data
  const positions = {};
  for (const k of PLANET_ORDER) {
    const trop = tropical[k];
    const sid = sidereal[k];
    const tropSign = longitudeToSign(trop.lon);
    const sidSign = longitudeToSign(sid.lon);
    const nak = longitudeToNakshatra(sid.lon);
    const westHouse = houseOfLongitude(trop.lon, houses.cusps);
    const vedicHouse = houseOfLongitude(sid.lon, vedicHouses);
    positions[k] = {
      name: PLANET_INFO[k].name,
      glyph: PLANET_INFO[k].glyph,
      abbr: PLANET_INFO[k].abbr,
      tropical: trop.lon,
      sidereal: sid.lon,
      latitude: trop.lat,
      distance: trop.r,
      retrograde: trop.retrograde,
      tropSign, sidSign, nakshatra: nak,
      westHouse, vedicHouse
    };
  }
  // Aspects (Western, tropical)
  const aspects = findAspects(Object.fromEntries(
    Object.entries(positions).map(([k, v]) => [k, { lon: v.tropical }])
  ));
  return {
    input,
    jdUT, jde, T,
    ayanamsaDeg: ay * RAD,
    tropical,
    sidereal,
    positions,
    houses: { ...houses, system: houseSystem },
    vedic: {
      asc: sidAsc,
      mc: sidMc,
      cusps: vedicHouses,
      ascSign: longitudeToSign(sidAsc)
    },
    aspects
  };
}
