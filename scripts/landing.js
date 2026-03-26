// scripts/landing.js - Landing page interactions (search, quick picks)

function searchCountry() {
  const query = sanitizeInput(document.getElementById('countrySearch').value);
  if (query) {
    showPage('dashboard');
    loadCountryData(query);
  }
}

function selectCountry(country) {
  document.getElementById('countrySearch').value = country;
  showPage('dashboard');
  loadCountryData(country);
}
