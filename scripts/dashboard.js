// scripts/dashboard.js - UI rendering and event listeners

// Sanitize user input: strip HTML characters and limit length
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>&"']/g, '').trim().slice(0, 100);
}

// Escape HTML for safe insertion into innerHTML
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// State
let chartInstance = null;
let currentISO = null;
let currentCountryName = null;
let currentCategory = 'economy';
let compareCountryISO = null;
let compareCountryName = null;

// Format a value for metric cards
function formatMetricValue(value, item) {
  if (value === null || typeof value !== 'number' || isNaN(value)) return 'N/A';
  if (item.isPercent) return value.toFixed(1) + '%';
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return value.toFixed(2);
}

// Format a value for indicator bars
function formatIndicatorValue(value, item) {
  if (value === null || typeof value !== 'number' || isNaN(value)) return 'N/A';
  if (item.isPercent) return value.toFixed(1) + '%';
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B ' + item.unit;
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M ' + item.unit;
  const formatted = Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  return formatted + (item.unit ? ' ' + item.unit : '');
}

// Show/hide landing vs dashboard
function showPage(page) {
  const landing = document.getElementById('landing');
  const dashboard = document.getElementById('dashboard');
  if (page === 'landing') {
    landing.style.display = 'block';
    dashboard.style.display = 'none';
  } else {
    landing.style.display = 'none';
    dashboard.style.display = 'block';
    dashboard.scrollIntoView({ behavior: 'smooth' });
  }
}

// Main entry: load country into dashboard
async function loadCountryData(name) {
  compareCountryISO = null;
  compareCountryName = null;

  if (countriesLoadFailed) {
    alert('Could not load the countries list. Please check your internet connection and refresh the page.');
    showPage('landing');
    return;
  }

  const countryInfo = await fetchCountry(name);

  if (countryInfo.iso2 === 'XX') {
    alert(`Country "${name}" not found. Try the full name (e.g. "United States", "South Africa").`);
    document.getElementById('dbSearch').value = '';
    if (!currentISO || currentISO === 'XX') showPage('landing');
    return;
  }

  currentISO = countryInfo.iso2;
  currentCountryName = countryInfo.name && countryInfo.name !== 'N/A' ? countryInfo.name : name;

  document.getElementById('countryName').textContent = currentCountryName;
  document.getElementById('countryRegion').textContent = countryInfo.region;

  const badge = document.getElementById('countryStatus');
  badge.textContent = countryInfo.status;
  const status = countryInfo.status.toLowerCase();
  badge.className = 'status-badge';
  if (status.includes('high income'))         badge.classList.add('badge-high');
  else if (status.includes('upper middle'))   badge.classList.add('badge-upper-mid');
  else if (status.includes('lower middle'))   badge.classList.add('badge-lower-mid');
  else if (status.includes('low income'))     badge.classList.add('badge-low');
  else                                        badge.classList.add('badge-unknown');

  const grid = document.getElementById('metricsGrid');
  grid.innerHTML = '<div style="padding: 20px; color: #718096; grid-column: 1/-1;">Loading metrics...</div>';

  const metricCategories = ['economy', 'health', 'technology', 'environment', 'education'];
  const metricsData = await Promise.all(
    metricCategories.map(async cat => {
      const item = indicatorData[cat][0];
      const val = await fetchSingleIndicator(currentISO, item.id);
      return { cat, item, value: val };
    })
  );

  grid.innerHTML = metricsData.map(({ cat, item, value }) => `
    <div class="metric-card">
      <div class="metric-title">${escapeHTML(cat.charAt(0).toUpperCase() + cat.slice(1))}</div>
      <div class="metric-value">${escapeHTML(formatMetricValue(value, item))}</div>
      <div class="metric-unit">${escapeHTML(item.name)}</div>
    </div>
  `).join('');

  await populateIndicators('economy');
}

// Populate the indicators sidebar for a given category
async function populateIndicators(category) {
  currentCategory = category;
  const list = document.getElementById('indicator-list');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-category="${category}"]`).classList.add('active');

  list.innerHTML = '<div style="padding: 20px; color: #718096;">Loading...</div>';

  const data = await fetchIndicatorValues(currentISO, category);

  const sortDir = document.querySelector('.sort-select').value;
  let sorted = [...data];
  if (sortDir === 'Highest to Lowest') sorted.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  else if (sortDir === 'Lowest to Highest') sorted.sort((a, b) => (a.value ?? Infinity) - (b.value ?? Infinity));

  list.innerHTML = sorted.map(item => {
    const percent = item.value !== null ? Math.min((item.value / item.max) * 100, 100) : 0;
    return `
      <div class="indicator-item">
        <span class="indicator-name">${escapeHTML(item.name)}</span>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
          <span class="indicator-value">${escapeHTML(formatIndicatorValue(item.value, item))}</span>
        </div>
      </div>
    `;
  }).join('');

  await updateChart(currentISO, category);
}

// Render the chart for a category, with optional compare country overlay
async function updateChart(iso2, category) {
  const spinner = document.getElementById('chartSpinner');
  const canvas = document.getElementById('dataChart');
  const ctx = canvas.getContext('2d');
  const primary = (indicatorData[category] || indicatorData.economy).find(i => i.id);

  if (!primary || !iso2 || iso2 === 'XX') {
    renderEmptyChart(ctx);
    return;
  }

  spinner.style.display = 'flex';
  canvas.style.display = 'none';
  document.getElementById('chartTitle').textContent = `${primary.name} — Loading...`;

  const [ts1, ts2] = await Promise.all([
    fetchTimeSeries(iso2, primary.id),
    compareCountryISO ? fetchTimeSeries(compareCountryISO, primary.id) : Promise.resolve(null)
  ]);

  if (chartInstance) chartInstance.destroy();

  const labels = (ts1 || ts2)
    ? (ts1 ? ts1.labels : ts2.labels)
    : ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];

  const datasets = [
    {
      label: currentCountryName || iso2,
      data: ts1 ? ts1.values : [],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true,
      spanGaps: true
    }
  ];

  if (compareCountryISO && ts2) {
    datasets.push({
      label: compareCountryName || compareCountryISO,
      data: ts2.values,
      borderColor: '#f6ad55',
      backgroundColor: 'rgba(246, 173, 85, 0.1)',
      tension: 0.4,
      fill: true,
      spanGaps: true
    });
  }

  const title = compareCountryISO
    ? `${primary.name}: ${currentCountryName} vs ${compareCountryName}`
    : `${primary.name}${primary.unit ? ' (' + primary.unit + ')' : ''}`;

  document.getElementById('chartTitle').textContent = title;

  spinner.style.display = 'none';
  canvas.style.display = 'block';

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { intersect: false },
      scales: { y: { type: 'linear', display: true, position: 'left' } },
      plugins: { legend: { position: 'top' } }
    }
  });
}

// Empty chart shown when no data is available
function renderEmptyChart(ctx) {
  document.getElementById('chartSpinner').style.display = 'none';
  document.getElementById('dataChart').style.display = 'block';
  if (chartInstance) chartInstance.destroy();
  document.getElementById('chartTitle').textContent = 'No data available';
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'No data', data: [] }] },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'No data returned from the World Bank API for this indicator.' }
      }
    }
  });
}

// Compare button: prompt for a country, overlay on chart
async function startCompare() {
  const raw = prompt('Enter a country name to compare with:');
  const name = sanitizeInput(raw);
  if (!name) return;

  const info = await fetchCountry(name);
  if (!info || info.iso2 === 'XX') {
    alert(`Country "${name}" not found. Try the full name (e.g. "United States", "South Africa").`);
    return;
  }

  compareCountryISO = info.iso2;
  compareCountryName = info.name || name;

  await updateChart(currentISO, currentCategory);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initCountriesList(); // pre-fetch in background

  document.querySelector('.category-tabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) populateIndicators(e.target.dataset.category);
  });

  document.querySelector('.sort-select').addEventListener('change', () => {
    populateIndicators(currentCategory);
  });

  document.getElementById('dbSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = sanitizeInput(e.target.value);
      if (query) { showPage('dashboard'); loadCountryData(query); }
    }
  });

  document.querySelector('.compare-btn').addEventListener('click', startCompare);
});
