// ════════════════════════ DATA & ASSETS ════════════════════════
const STORAGE_KEY = 'mgc_data_v4';
const THEME_KEY = 'mgc_theme_v1';
const FONT_SIZE_KEY = 'mgc_fontsize_v1';
const FONT_FAMILY_KEY = 'mgc_fontfamily_v1';

const DEVICE_IMAGES = {
  'atari': 'assets/images/atari.png',
  'sega': 'assets/images/sega.png',
  'ps1': 'assets/images/PS1.png',
  'ps2': 'assets/images/PS2.png',
  'ps3': 'assets/images/PS3.png',
  'ps4': 'assets/images/PS4.png',
  'ps5': 'assets/images/PS5.png',
  'pc': 'assets/images/PC.png',
  'other': 'assets/images/app_icon.png'
};

const DEFAULT_CATS = [
  { id: 'atari', name: 'Atari', img: DEVICE_IMAGES['atari'] },
  { id: 'sega', name: 'Sega', img: DEVICE_IMAGES['sega'] },
  { id: 'ps1', name: 'PlayStation 1', img: DEVICE_IMAGES['ps1'] },
  { id: 'ps2', name: 'PlayStation 2', img: DEVICE_IMAGES['ps2'] },
  { id: 'ps3', name: 'PlayStation 3', img: DEVICE_IMAGES['ps3'] },
  { id: 'ps4', name: 'PlayStation 4', img: DEVICE_IMAGES['ps4'] },
  { id: 'ps5', name: 'PlayStation 5', img: DEVICE_IMAGES['ps5'] },
  { id: 'pc', name: 'PC', img: DEVICE_IMAGES['pc'] },
];

let state = { categories: [], games: [] };
let tempCategories = [];
let editingGameId = null;
let currentDevice = null;
let currentPage = 'home';
let catToDeleteId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
    if (!state.categories || !state.categories.length) state.categories = DEFAULT_CATS;
    if (!state.games) state.games = [];
  } catch { state = { categories: DEFAULT_CATS, games: [] }; }
  
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'medium';
  const savedFontFamily = localStorage.getItem(FONT_FAMILY_KEY) || 'Cairo';
  
  applyTheme(savedTheme);
  applyFontSize(savedFontSize);
  applyFontFamily(savedFontFamily);
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ════════════════════════ THEME & FONT CONTROL ════════════════════════
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) themeSelect.value = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme(theme) {
  applyTheme(theme);
  toast(theme === 'dark' ? 'تم التفعيل: الوضع الداكن 🌙' : 'تم التفعيل: الوضع النهاري ☀️');
}

function applyFontSize(size) {
  document.documentElement.setAttribute('data-font-size', size);
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  if (fontSizeSelect) fontSizeSelect.value = size;
  localStorage.setItem(FONT_SIZE_KEY, size);
}

function changeFontSize(size) {
  applyFontSize(size);
  toast('تم تغيير حجم الخط 🔤');
}

function applyFontFamily(font) {
  document.documentElement.setAttribute('data-font-family', font);
  const fontFamilySelect = document.getElementById('fontFamilySelect');
  if (fontFamilySelect) fontFamilySelect.value = font;
  localStorage.setItem(FONT_FAMILY_KEY, font);
}

function changeFontFamily(font) {
  applyFontFamily(font);
  toast('تم تغيير نوع الخط العربي ✨');
}

// ════════════════════════ NAVIGATION ════════════════════════
function navigate(page, deviceId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-btn').forEach(m => m.classList.remove('active'));
  
  const navEl = document.getElementById('nav-' + page);
  const mNavEl = document.getElementById('m-nav-' + page);
  if (navEl) navEl.classList.add('active');
  if (mNavEl) mNavEl.classList.add('active');

  if (page === 'device' && deviceId) {
    currentDevice = deviceId;
    currentPage = 'device';
    document.getElementById('page-device').classList.add('active');
    renderDevice();
  } else {
    currentPage = page;
    document.getElementById('page-' + page).classList.add('active');
    if (page === 'home') renderHome();
    if (page === 'all') renderAll();
    if (page === 'stats') renderStats();
  }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('collapsed');
}

// ════════════════════════ HELPERS ════════════════════════
function getCat(id) { 
  return state.categories.find(c => c.id === id) || { name: id, img: DEVICE_IMAGES['other'] }; 
}

function gameCardHTML(game) {
  const cat = getCat(game.catId);
  const coverHTML = game.cover 
    ? `<img class="game-cover" src="${game.cover}" alt="${escHtml(game.name)}" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">`
    : `<div class="game-cover-placeholder">🎮</div>`;
  const yearText = game.year ? ` • ${game.year}` : '';

  return `
    <div class="game-card glass-shine" id="game-card-${game.id}">
      <div class="game-cover-container">
        ${coverHTML}
      </div>
      <div class="game-info">
        <div>
          <div class="game-name" title="${escHtml(game.name)}">${escHtml(game.name)}</div>
          <div class="game-meta">
            <img src="${cat.img || DEVICE_IMAGES['other']}" alt="" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">
            <span>${escHtml(cat.name)}${yearText}</span>
          </div>
        </div>
        <div class="game-actions">
          <button class="btn btn-secondary" onclick="openEditGame('${game.id}')">✏️ تعديل</button>
          <button class="btn btn-danger" onclick="deleteGame('${game.id}')">🗑 حذف</button>
        </div>
      </div>
    </div>`;
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════ HOME ════════════════════════
function renderHome() {
  const totalGames = state.games.length;
  document.getElementById('totalGamesBadge').textContent = `${totalGames} لعبة`;

  document.getElementById('heroDevicesPreview').innerHTML = state.categories.map(cat => `
    <img src="${cat.img || DEVICE_IMAGES['other']}" class="hero-device-img" title="${escHtml(cat.name)}" onclick="navigate('device','${cat.id}')" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">
  `).join('');

  document.getElementById('devicesGrid').innerHTML = state.categories.map(cat => {
    const count = state.games.filter(g => g.catId === cat.id).length;
    return `
      <div class="device-card glass-shine" onclick="navigate('device','${cat.id}')">
        <img class="device-card-img" src="${cat.img || DEVICE_IMAGES['other']}" alt="${escHtml(cat.name)}" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">
        <div class="device-name">${escHtml(cat.name)}</div>
        <div class="device-count">${count} لعبة</div>
        <button class="btn-view">عرض الألعاب</button>
      </div>`;
  }).join('');
}

// ════════════════════════ ALL GAMES ════════════════════════
function renderAll() {
  const sort = document.getElementById('sortAll').value;
  let games = [...state.games];
  
  if (sort === 'year-asc') games.sort((a,b) => (a.year||0)-(b.year||0));
  if (sort === 'year-desc') games.sort((a,b) => (b.year||0)-(a.year||0));
  if (sort === 'name-asc') games.sort((a,b) => a.name.localeCompare(b.name,'ar'));

  document.getElementById('allCount').textContent = `${games.length} لعبة مسجلة`;
  document.getElementById('allGamesGrid').innerHTML = games.length
    ? games.map(gameCardHTML).join('')
    : `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px;">لا توجد ألعاب مضافة حالياً</div>`;
    
  setupTouchGestures();
}

// ════════════════════════ STATS ════════════════════════
function renderStats() {
  document.getElementById('statsBars').innerHTML = state.categories.map(cat => {
    const cnt = state.games.filter(g => g.catId === cat.id).length;
    return `
      <div class="stat-bar-row">
        <div class="stat-bar-label">
          <img src="${cat.img || DEVICE_IMAGES['other']}" style="width:24px; height:24px; object-fit:contain;" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">
          <span>${escHtml(cat.name)}</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width:${Math.min(cnt * 10, 100)}%"></div>
        </div>
        <div class="stat-bar-count">${cnt} ألعاب</div>
      </div>`;
  }).join('');
}

// ════════════════════════ DEVICE PAGE ════════════════════════
function renderDevice() {
  const cat = getCat(currentDevice);
  document.getElementById('deviceTitle').innerHTML = `
    <img src="${cat.img || DEVICE_IMAGES['other']}" style="width:30px; height:30px; object-fit:contain;" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">
    <span>${escHtml(cat.name)}</span>
  `;
  const games = state.games.filter(g => g.catId === currentDevice);
  document.getElementById('deviceCount').textContent = `${games.length} لعبة`;
  document.getElementById('deviceGrid').innerHTML = games.length
    ? games.map(gameCardHTML).join('')
    : `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px;">لا توجد ألعاب لهذا الجهاز</div>`;
    
  setupTouchGestures();
}

// ════════════════════════ SEARCH ════════════════════════
function doSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) { navigate(currentPage === 'search' ? 'home' : currentPage); return; }
  
  const results = state.games.filter(g => g.name.toLowerCase().includes(q));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-search').classList.add('active');
  
  document.getElementById('searchCount').textContent = `${results.length} نتيجة`;
  document.getElementById('searchGrid').innerHTML = results.map(gameCardHTML).join('');
  setupTouchGestures();
}

// ════════════════════════ ADD/EDIT GAME & BASE64 ════════════════════════
function openAddGame() {
  editingGameId = null;
  document.getElementById('gameModalTitle').textContent = '➕ إضافة لعبة';
  document.getElementById('gameName').value = '';
  document.getElementById('gameYear').value = '';
  document.getElementById('gameCover').value = '';
  populateCatSelect(state.categories[0]?.id);
  openModal('modalGame');
}

function openEditGame(id) {
  const g = state.games.find(g => g.id === id);
  if (!g) return;
  editingGameId = id;
  document.getElementById('gameModalTitle').textContent = '✏️ تعديل اللعبة';
  document.getElementById('gameName').value = g.name;
  document.getElementById('gameYear').value = g.year || '';
  document.getElementById('gameCover').value = g.cover || '';
  populateCatSelect(g.catId);
  openModal('modalGame');
}

function populateCatSelect(selectedId) {
  document.getElementById('gameCat').innerHTML = state.categories.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escHtml(c.name)}</option>`
  ).join('');
}

function handleImageImport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('gameCover').value = e.target.result;
    toast('تم تحويل الصورة إلى Base64 وجاهزة للحفظ! 🖼️');
  };
  reader.readAsDataURL(file);
}

function saveGame() {
  const name = document.getElementById('gameName').value.trim();
  if (!name) { toast('يرجى كتابة اسم اللعبة'); return; }

  const catId = document.getElementById('gameCat').value;
  const year = document.getElementById('gameYear').value ? parseInt(document.getElementById('gameYear').value) : null;
  const cover = document.getElementById('gameCover').value.trim();

  if (editingGameId) {
    const g = state.games.find(g => g.id === editingGameId);
    if (g) { g.name = name; g.catId = catId; g.year = year; g.cover = cover; }
  } else {
    state.games.push({ id: genId(), name, catId, year, cover });
  }

  saveState();
  closeModal('modalGame');
  refreshCurrentPage();
  toast('تم الحفظ بنجاح ✅');
}

function deleteGame(id) {
  if (!confirm('هل تريد حذف هذه اللعبة؟')) return;
  state.games = state.games.filter(g => g.id !== id);
  saveState();
  refreshCurrentPage();
  toast('تم الحذف 🗑️');
}

// ════════════════════════ CATEGORIES ════════════════════════
function openCats() {
  tempCategories = JSON.parse(JSON.stringify(state.categories));
  document.getElementById('newCatName').value = '';
  document.getElementById('newCatImg').value = '';
  renderCatList();
  openModal('modalCats');
}

function closeCatsModal() {
  closeModal('modalCats');
}

function saveCatsAndClose() {
  state.categories = JSON.parse(JSON.stringify(tempCategories));
  saveState();
  closeModal('modalCats');
  refreshCurrentPage();
  toast('تم حفظ الأجهزة بنجاح ✅');
}

function handleCatImageImport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('newCatImg').value = e.target.result;
    toast('تم تحويل صورة الجهاز إلى Base64 🖼️');
  };
  reader.readAsDataURL(file);
}

function renderCatList() {
  document.getElementById('catList').innerHTML = tempCategories.map((cat, index) => `
    <div class="cat-item" id="cat-item-${cat.id}">
      <div class="cat-item-name">
        <img class="cat-item-img" src="${cat.img || DEVICE_IMAGES['other']}" onerror="this.onerror=null;this.src='assets/images/app_icon.png';">
        <span id="cat-label-${cat.id}">${escHtml(cat.name)}</span>
      </div>
      <div class="cat-actions-group" id="cat-actions-${cat.id}">
        <button class="btn btn-secondary btn-icon" onclick="moveCat('${cat.id}', -1)" ${index === 0 ? 'disabled style="opacity:0.4"' : ''} title="تحريك لأعلى">⬆️</button>
        <button class="btn btn-secondary btn-icon" onclick="moveCat('${cat.id}', 1)" ${index === tempCategories.length - 1 ? 'disabled style="opacity:0.4"' : ''} title="تحريك لأسفل">⬇️</button>
        <button class="btn btn-secondary" onclick="enableCatEdit('${cat.id}')">✏️ تعديل</button>
        <button class="btn btn-danger" onclick="confirmDeleteCat('${cat.id}')">🗑 حذف</button>
      </div>
    </div>
  `).join('');
}

function moveCat(id, direction) {
  const idx = tempCategories.findIndex(c => c.id === id);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= tempCategories.length) return;

  const temp = tempCategories[idx];
  tempCategories[idx] = tempCategories[newIdx];
  tempCategories[newIdx] = temp;

  renderCatList();
}

function enableCatEdit(id) {
  const cat = tempCategories.find(c => c.id === id);
  if (!cat) return;

  const labelEl = document.getElementById(`cat-label-${id}`);
  const actionsEl = document.getElementById(`cat-actions-${id}`);

  labelEl.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
      <input type="text" class="cat-edit-input" id="cat-input-${id}" value="${escHtml(cat.name)}" placeholder="اسم الجهاز">
      <input type="text" class="cat-edit-input" id="cat-img-input-${id}" value="${escHtml(cat.img || '')}" placeholder="رابط الصورة أو Base64">
    </div>
  `;

  actionsEl.innerHTML = `
    <button class="btn btn-primary" onclick="saveCatEdit('${id}')">💾 حفظ</button>
    <button class="btn btn-secondary" onclick="renderCatList()">إلغاء</button>
  `;
}

function saveCatEdit(id) {
  const nameEl = document.getElementById(`cat-input-${id}`);
  const imgEl = document.getElementById(`cat-img-input-${id}`);
  if (!nameEl) return;
  
  const newName = nameEl.value.trim();
  const newImg = imgEl ? imgEl.value.trim() : '';

  if (newName) {
    const cat = tempCategories.find(c => c.id === id);
    if (cat) {
      cat.name = newName;
      cat.img = newImg || DEVICE_IMAGES['other'];
    }
  }
  renderCatList();
}

function addCat() {
  const name = document.getElementById('newCatName').value.trim();
  const img = document.getElementById('newCatImg').value.trim();
  if (!name) { toast('يرجى كتابة اسم الجهاز'); return; }

  const newDevice = {
    id: genId(),
    name: name,
    img: img || DEVICE_IMAGES['other']
  };

  tempCategories.push(newDevice);
  renderCatList();
  document.getElementById('newCatName').value = '';
  document.getElementById('newCatImg').value = '';
}

function confirmDeleteCat(id) {
  catToDeleteId = id;
  openModal('modalConfirmDelete');
}

function executeDeleteCat() {
  if (!catToDeleteId) return;
  tempCategories = tempCategories.filter(c => c.id !== catToDeleteId);
  renderCatList();
  closeModal('modalConfirmDelete');
  catToDeleteId = null;
}

// ════════════════════════ TOUCH GESTURES (TOUCH SUPPORT) ════════════════════════
function setupTouchGestures() {
  const cards = document.querySelectorAll('.game-card');
  cards.forEach(card => {
    let touchstartX = 0;
    let touchendX = 0;
    
    card.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].screenX;
    }, false);

    card.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      handleSwipe();
    }, false);

    function handleSwipe() {
      if (touchendX < touchstartX - 50) {
        card.style.transform = 'translateX(-10px)';
        setTimeout(() => card.style.transform = '', 300);
      }
      if (touchendX > touchstartX + 50) {
        card.style.transform = 'translateX(10px)';
        setTimeout(() => card.style.transform = '', 300);
      }
    }
  });
}

// ════════════════════════ SETTINGS & UTILS ════════════════════════
function openSettings() { openModal('modalSettings'); }
function openAbout() { openModal('modalAbout'); }

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'game-collection-backup.json'; a.click();
}

function importData(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      state = JSON.parse(e.target.result);
      saveState(); refreshCurrentPage();
      closeModal('modalSettings');
      toast('تم استيراد البيانات ✅');
    } catch { toast('ملف غير صالح'); }
  };
  reader.readAsText(file);
}

// دالة فتح نافذة تأكيد المسح
function openClearDataModal() {
  closeModal('modalSettings');
  openModal('modalConfirmClearData');
}

// دالة تنفيذ مسح البيانات وتحديث الواجهة بدون إعادة تحميل الصفحة
function executeClearAllData() {
  localStorage.clear();

  state = { 
    categories: JSON.parse(JSON.stringify(DEFAULT_CATS)), 
    games: [] 
  };

  applyTheme('dark');
  applyFontSize('medium');
  applyFontFamily('Cairo');

  closeModal('modalConfirmClearData');
  navigate('home');
  toast('تم مسح جميع البيانات بنجاح 🗑️');
}

function toast(msg) {
  const tc = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast'; div.textContent = msg;
  tc.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

function refreshCurrentPage() {
  if (currentPage === 'home') renderHome();
  else if (currentPage === 'all') renderAll();
  else if (currentPage === 'stats') renderStats();
  else if (currentPage === 'device') renderDevice();
}

// Hide Splash Screen
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) splash.classList.add('hidden');
  }, 1800);
});

// ════════════════════════ INIT ════════════════════════
loadState();
renderHome();

// ════════════════════════ CHECK FOR UPDATES ════════════════════════
const CURRENT_VERSION = "1.0.1"; 
const VERSION_URL = "https://abumoren.github.io/my-game-collection/version.json";

function checkForUpdates() {
  if (!navigator.onLine) return;

  fetch(VERSION_URL)
    .then(res => res.json())
    .then(data => {
      if (data.latestVersion && data.latestVersion !== CURRENT_VERSION) {
        if (confirm(`يتوفر إصدار جديد (${data.latestVersion})! هل تريد التحميل والتحديث الآن؟`)) {
          window.location.href = data.downloadUrl;
        }
      }
    })
    .catch(() => {});
}

window.addEventListener('load', checkForUpdates);