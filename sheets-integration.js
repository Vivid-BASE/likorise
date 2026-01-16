// ===================================
// Google Sheets Integration
// ===================================

// Configuration - UPDATE THIS WITH YOUR SPREADSHEET ID
const SPREADSHEET_ID = '1DzwHNeIu2mrUDX9vYmB-jY3ZZwF0yU4blJHA_WKbsBc';

// Sheet names
const SHEETS = {
  COMPANY: '会社情報',
  INSTRUCTORS: 'レッスン講師',
  SCHEDULE: '年間スケジュール',
  MEMBERS: '所属生情報'
};

// Load data from Google Sheets on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if spreadsheet ID is configured
  if (SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    loadGoogleSheetsData();
  }
});

/**
 * Main function to load all data from Google Sheets
 */
async function loadGoogleSheetsData() {
  try {
    // Load all sheets concurrently
    const [instructors, schedule, members] = await Promise.all([
      fetchSheetData(SHEETS.INSTRUCTORS),
      fetchSheetData(SHEETS.SCHEDULE),
      fetchSheetData(SHEETS.MEMBERS)
    ]);

    // Render data to page
    if (instructors) renderInstructors(instructors);
    if (schedule) renderSchedule(schedule);
    if (members) renderMembers(members);

    console.log('✅ Google Sheets data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading Google Sheets data:', error);
    // Keep existing hardcoded content as fallback
  }
}

/**
 * Fetch data from a specific sheet
 */
async function fetchSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching sheet "${sheetName}":`, error);
    return null;
  }
}

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Remove quotes from headers and data
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

/**
 * Render instructors section
 */
function renderInstructors(data) {
  const container = document.querySelector('#instructors .card-grid');
  if (!container) return;

  // Sort by display order
  data.sort((a, b) => parseInt(a['表示順']) - parseInt(b['表示順']));

  container.innerHTML = data.map(instructor => `
    <div class="card">
      <div style="width: 120px; height: 120px; margin: 0 auto var(--spacing-sm); border-radius: 50%; overflow: hidden; box-shadow: var(--shadow-md);">
        <img src="${instructor['画像ファイル名']}" alt="${instructor['名前']}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <h3 style="color: var(--primary-salmon); margin-bottom: var(--spacing-xs);">${instructor['名前']}</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">${instructor['カテゴリ']}</p>
    </div>
  `).join('');
}

/**
 * Render annual schedule section
 */
function renderSchedule(data) {
  const container = document.querySelector('#schedule .timeline');
  if (!container) return;

  // Sort by display order
  data.sort((a, b) => parseInt(a['表示順']) - parseInt(b['表示順']));

  container.innerHTML = data.map(item => `
    <div class="timeline-item">
      <div class="timeline-marker"></div>
      <div class="timeline-content">
        <h4>${item['月']} - ${item['タイトル']}</h4>
        <p>${item['説明']}</p>
      </div>
    </div>
  `).join('');
}

/**
 * Render members section
 */
function renderMembers(data) {
  const container = document.querySelector('#members .container');
  if (!container || data.length < 2) return;

  const crewData = data.find(item => item['カテゴリ'] === 'CREW');
  const ambassadorData = data.find(item => item['カテゴリ'] === 'AMBASSADOR');

  let html = '<h2 class="section-title">所属生情報</h2>';

  if (crewData) {
    html += `
      <div style="margin-bottom: var(--spacing-xl);">
        <h3 style="text-align: center; font-size: 2rem; margin-bottom: var(--spacing-md); color: var(--primary-salmon);">CREW</h3>
        <div style="background: white; padding: var(--spacing-md); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
          <p style="text-align: center; color: var(--text-secondary);">${crewData['説明']}</p>
        </div>
      </div>
    `;
  }

  if (ambassadorData) {
    html += `
      <div>
        <h3 style="text-align: center; font-size: 2rem; margin-bottom: var(--spacing-md); color: var(--secondary-mint);">AMBASSADOR</h3>
        <div style="background: white; padding: var(--spacing-md); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
          <p style="text-align: center; color: var(--text-secondary);">${ambassadorData['説明']}</p>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}
