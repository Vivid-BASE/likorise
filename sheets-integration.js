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
 * Properly handles quoted fields containing commas
 */
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse a single CSV line respecting quotes
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  };

  // Parse headers
  const headers = parseLine(lines[0]);
  const data = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
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
  if (!container || !data || data.length === 0) return;

  // Sort by display order
  data.sort((a, b) => parseInt(a['表示順']) - parseInt(b['表示順']));

  // Map lesson categories to icons and colors
  const lessonStyles = {
    'お芝居Lesson': { icon: '🎭', title: 'お芝居', color: 'var(--primary-peach)' },
    'アテレコLesson': { icon: '🎤', title: 'アテレコ', color: 'var(--secondary-mint)' },
    'ダンスLesson [HIPHOP]': { icon: '💃', title: 'ダンス [HIPHOP]', color: 'var(--primary-salmon)' },
    'ダンスLesson [JAZZ]': { icon: '🕺', title: 'ダンス [JAZZ]', color: 'var(--secondary-lavender)' }
  };

  container.innerHTML = data.map(instructor => {
    const style = lessonStyles[instructor['カテゴリ']] || { icon: '✨', title: instructor['カテゴリ'], color: 'var(--primary-salmon)' };

    return `
      <div class="card">
        <div class="lesson-header" style="background: ${style.color};">
          <h3>${style.icon} ${style.title}</h3>
        </div>
        
        <div style="width: 120px; height: 120px; margin: 0 auto var(--spacing-sm); border-radius: 50%; overflow: hidden; box-shadow: var(--shadow-sm); background-color: white;">
          <img src="${instructor['画像ファイル名']}" alt="${instructor['名前']}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        
        <p class="card-text">
          <strong style="font-size: 1.2rem; color: var(--primary-salmon);">${instructor['名前']}</strong>
        </p>
      </div>
    `;
  }).join('');
}

/**
 * Render annual schedule section
 */
function renderSchedule(data) {
  const container = document.querySelector('#schedule .timeline');
  if (!container || !data || data.length === 0) return;

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
  if (!container || !data || data.length < 2) return;

  const crewData = data.find(item => item['カテゴリ'] === 'CREW');
  const ambassadorData = data.find(item => item['カテゴリ'] === 'AMBASSADOR');

  let html = '<h2 class="section-title">所属生情報</h2>';

  if (crewData) {
    // Convert newlines to <br> and format bullet points
    const description = crewData['説明']
      .replace(/\n/g, '<br>')
      .replace(/\* /g, '• ');

    html += `
      <div style="margin-bottom: var(--spacing-xl);">
        <h3 style="text-align: center; font-size: 2rem; margin-bottom: var(--spacing-md); color: var(--primary-salmon);">CREW</h3>
        <div style="background: white; padding: var(--spacing-md); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
          <p style="text-align: left; color: var(--text-secondary); line-height: 1.8;">${description}</p>
        </div>
      </div>
    `;
  }

  if (ambassadorData) {
    const description = ambassadorData['説明'].replace(/\n/g, '<br>');

    html += `
      <div>
        <h3 style="text-align: center; font-size: 2rem; margin-bottom: var(--spacing-md); color: var(--secondary-mint);">AMBASSADOR</h3>
        <div style="background: white; padding: var(--spacing-md); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
          <p style="text-align: center; color: var(--text-secondary);">${description}</p>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}
