// scripts/api.js - All World Bank API fetch functions and caches

const countryCache = new Map();
const indicatorsCache = new Map();
let countriesList = [];
let countriesLoadFailed = false;

// Load all WB countries into memory for name-based search
async function initCountriesList() {
  if (countriesList.length > 0) return;
  try {
    const res = await fetch(`${WB_BASE}/country?format=json&per_page=500`);
    const data = await res.json();
    if (data[1]) {
      // Filter out aggregate groups (they have region.id === 'NA')
      countriesList = data[1].filter(c => c.region && c.region.id !== 'NA');
    }
  } catch (e) {
    console.warn('Could not load countries list:', e);
    countriesLoadFailed = true;
  }
}

// Find a country by name/ISO → returns { iso2, region, status, name }
async function fetchCountry(name) {
  const key = name.toLowerCase().trim();
  if (countryCache.has(key)) return countryCache.get(key);

  await initCountriesList();

  const match = countriesList.find(c =>
    c.name.toLowerCase() === key ||
    c.name.toLowerCase().includes(key) ||
    c.iso2Code.toLowerCase() === key ||
    c.id.toLowerCase() === key
  );

  if (match) {
    const info = {
      iso2: match.iso2Code,
      region: match.region?.value || 'N/A',
      status: match.incomeLevel?.value || 'N/A',
      name: match.name
    };
    countryCache.set(key, info);
    return info;
  }

  return { iso2: 'XX', region: 'N/A', status: 'N/A', name };
}

// Fetch most recent non-null value for a single indicator
async function fetchSingleIndicator(iso2, indicatorId) {
  const cacheKey = `${iso2}_${indicatorId}`;
  if (indicatorsCache.has(cacheKey)) return indicatorsCache.get(cacheKey);

  try {
    const res = await fetch(`${WB_BASE}/country/${iso2}/indicator/${indicatorId}?format=json&mrv=5&per_page=5`);
    const data = await res.json();
    if (data[1]) {
      const entry = data[1].find(d => d.value !== null);
      if (entry) {
        indicatorsCache.set(cacheKey, entry.value);
        return entry.value;
      }
    }
  } catch (e) {
    console.warn(`Indicator fetch failed: ${indicatorId}`, e);
  }
  return null;
}

// Fetch all indicator values for a category
async function fetchIndicatorValues(iso2, category) {
  const base = indicatorData[category] || indicatorData.economy;
  if (!iso2 || iso2 === 'XX') return base.map(ind => ({ ...ind, value: null }));

  const results = await Promise.all(
    base.map(async (ind) => {
      const val = await fetchSingleIndicator(iso2, ind.id);
      return { ...ind, value: val };
    })
  );
  return results;
}

// Fetch 10-year time series for a single indicator
async function fetchTimeSeries(iso2, indicatorId) {
  const cacheKey = `ts_${iso2}_${indicatorId}`;
  if (indicatorsCache.has(cacheKey)) return indicatorsCache.get(cacheKey);

  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;

  try {
    const res = await fetch(
      `${WB_BASE}/country/${iso2}/indicator/${indicatorId}?format=json&per_page=10&date=${startYear}:${endYear}`
    );
    const data = await res.json();
    if (data[1] && data[1].length > 0) {
      const sorted = [...data[1]].sort((a, b) => Number(a.date) - Number(b.date));
      const result = {
        labels: sorted.map(d => d.date),
        values: sorted.map(d => d.value)
      };
      indicatorsCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.warn(`Time series fetch failed: ${indicatorId}`, e);
  }
  return null;
}
