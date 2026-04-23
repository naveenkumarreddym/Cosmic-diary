/* =============================================================
 * DIARY MODULE
 * Three-tab persistent notebook for Dreams, Omens, and Events.
 * Data lives in localStorage under the key 'cosmic-diary-v1'.
 * Checksum covers this code (it's in the bundle). User data does
 * NOT affect the checksum because localStorage is outside the file.
 * ============================================================= */

const DIARY_STORAGE_KEY = 'cosmic-diary-v1';
const DIARY_TABS = ['dreams', 'omens', 'events'];
let DIARY_ACTIVE_TAB = 'dreams';

function diaryLoad() {
  try {
    const raw = localStorage.getItem(DIARY_STORAGE_KEY);
    if (!raw) return { dreams: [], omens: [], events: [] };
    const data = JSON.parse(raw);
    // Defensive: ensure all three tabs exist and are arrays
    for (const t of DIARY_TABS) {
      if (!Array.isArray(data[t])) data[t] = [];
    }
    return data;
  } catch (e) {
    console.warn('Diary load failed, starting fresh:', e);
    return { dreams: [], omens: [], events: [] };
  }
}

function diarySave(data) {
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    alert('Could not save diary entry: ' + (e.message || e) +
          '\n\nYour browser may have disabled localStorage, or storage is full.');
    return false;
  }
}

function diaryFormatDate(dateStr, timeStr) {
  // dateStr: 'YYYY-MM-DD', timeStr: 'HH:MM' → friendly string
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '12:00').split(':').map(Number);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${monthNames[m-1]} ${y}, ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function diaryEscapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function diaryRender() {
  const data = diaryLoad();
  const tab = DIARY_ACTIVE_TAB;
  const entries = data[tab] || [];
  // Sort newest first by (date, time) string
  const sorted = [...entries].sort((a, b) => {
    const ka = (a.date || '') + 'T' + (a.time || '00:00');
    const kb = (b.date || '') + 'T' + (b.time || '00:00');
    return kb.localeCompare(ka);
  });
  const container = document.getElementById('diary-entries');
  if (!container) return;
  if (sorted.length === 0) {
    container.innerHTML = `<div class="diary-empty">No ${tab} recorded yet. Add your first entry above.</div>`;
    return;
  }
  container.innerHTML = sorted.map(entry => {
    const when = diaryFormatDate(entry.date, entry.time);
    const text = diaryEscapeHTML(entry.text || '').replace(/\n/g, '<br>');
    return `
      <div class="diary-entry" data-id="${entry.id}">
        <div class="diary-entry-head">
          <span class="diary-entry-date">${diaryEscapeHTML(when)}</span>
          <button type="button" class="diary-del" data-del="${entry.id}" title="Delete" aria-label="Delete entry">×</button>
        </div>
        <div class="diary-entry-body">${text}</div>
      </div>
    `;
  }).join('');
}

function diaryAddEntry(dateStr, timeStr, text) {
  if (!dateStr || !text || !text.trim()) return false;
  const data = diaryLoad();
  const entry = {
    id: 'e' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    date: dateStr,
    time: timeStr || '12:00',
    text: text.trim(),
    created: new Date().toISOString()
  };
  data[DIARY_ACTIVE_TAB].push(entry);
  if (!diarySave(data)) return false;
  diaryRender();
  return true;
}

function diaryDeleteEntry(id) {
  const data = diaryLoad();
  for (const t of DIARY_TABS) {
    data[t] = (data[t] || []).filter(e => e.id !== id);
  }
  diarySave(data);
  diaryRender();
}

function diarySetTab(tab) {
  if (!DIARY_TABS.includes(tab)) return;
  DIARY_ACTIVE_TAB = tab;
  document.querySelectorAll('.diary-tab').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-diary-tab') === tab);
  });
  diaryRender();
}

function diaryExport() {
  const data = diaryLoad();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cosmic-diary-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function diaryImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      const data = diaryLoad();
      let added = 0;
      for (const t of DIARY_TABS) {
        const arr = Array.isArray(imported[t]) ? imported[t] : [];
        for (const entry of arr) {
          if (!entry || !entry.date || !entry.text) continue;
          // De-dupe by id if present
          const id = entry.id || ('e' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
          if (data[t].some(existing => existing.id === id)) continue;
          data[t].push({
            id,
            date: String(entry.date),
            time: String(entry.time || '12:00'),
            text: String(entry.text),
            created: entry.created || new Date().toISOString()
          });
          added++;
        }
      }
      if (!diarySave(data)) return;
      diaryRender();
      alert(`Imported ${added} ${added === 1 ? 'entry' : 'entries'}.`);
    } catch (err) {
      alert('Could not import: the file is not valid JSON or is in an unexpected format.');
    }
  };
  reader.readAsText(file);
}

function diaryBind() {
  // Tab switching
  document.querySelectorAll('.diary-tab').forEach(el => {
    el.addEventListener('click', () => diarySetTab(el.getAttribute('data-diary-tab')));
  });
  // Form
  const form = document.getElementById('diary-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('diary-date').value;
      const time = document.getElementById('diary-time').value;
      const text = document.getElementById('diary-text').value;
      if (diaryAddEntry(date, time, text)) {
        document.getElementById('diary-text').value = '';
        // Keep date/time populated for rapid successive entries
      }
    });
  }
  // Delete (event delegation)
  const wrap = document.getElementById('diary-entries');
  if (wrap) {
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.diary-del');
      if (!btn) return;
      if (confirm('Delete this entry?')) {
        diaryDeleteEntry(btn.getAttribute('data-del'));
      }
    });
  }
  // Export / import
  const exportBtn = document.getElementById('btn-diary-export');
  if (exportBtn) exportBtn.addEventListener('click', diaryExport);
  const importInp = document.getElementById('diary-import');
  if (importInp) {
    importInp.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) diaryImport(f);
      e.target.value = ''; // reset so same file can be re-imported
    });
  }
  // Collapse / expand
  const toggleBtn = document.getElementById('btn-toggle-diary');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.querySelector('.diary-card').classList.toggle('collapsed');
    });
  }
  // Pre-fill today in the form
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const dateInp = document.getElementById('diary-date');
  const timeInp = document.getElementById('diary-time');
  if (dateInp && !dateInp.value) dateInp.value = `${y}-${mo}-${d}`;
  if (timeInp) timeInp.value = `${hh}:${mm}`;
  // Initial render
  diaryRender();
}
