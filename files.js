// files.js — files.php replacement for GitHub Pages
// data/index.json చదివి articles load చేస్తుంది
// Category filter కూడా JS లోనే చేస్తుంది

// ── Global cache — once loaded, reuse ──────────────────
let _indexCache = null;
let _allArticlesCache = null;

// data/index.json load చేయి (once, then cache)
async function _loadIndex() {
  if (_indexCache) return _indexCache;
  try {
    const res = await fetch('index.json');
    if (!res.ok) throw new Error('index.json ' + res.status);
    const data = await res.json();
    _indexCache = data.files || [];
    return _indexCache;
  } catch (e) {
    console.error('[files.js] index.json load failed:', e.message);
    return [];
  }
}

// అన్ని articles load చేయి + cache చేయి
async function _loadAllRaw() {
  if (_allArticlesCache) return _allArticlesCache;
  const files = await _loadIndex();
  if (!files.length) return [];
  const results = await Promise.all(
    files.map(f =>
      fetch('data/' + f)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );
  _allArticlesCache = results
    .map((raw, i) => ({ raw, fname: files[i] }))
    .filter(x => x.raw);
  return _allArticlesCache;
}

// files.php replacement — అన్ని files return చేయి
async function getFiles() {
  const files = await _loadIndex();
  return { files };
}

// files.php?category=X replacement — JS లో filter చేయి
async function getFilesByCategory(category) {
  const all = await _loadAllRaw();
  const cat = category.toLowerCase().trim();
  const filtered = all
    .filter(x => (x.raw.category || '').toLowerCase().trim() === cat)
    .map(x => x.fname);
  return { files: filtered };
}

// ── Main API used by index.html ─────────────────────────

async function loadAllArticles() {
  let fileList = [];
  try {
    const data = await getFiles();
    fileList = data.files || [];
  } catch (e) {
    console.error('[files.js] loadAllArticles error:', e.message);
    return false;
  }
  if (!fileList.length) return false;

  const results = await Promise.all(
    fileList.map(fname =>
      fetch('data/' + fname).then(r => r.ok ? r.json() : null).catch(() => null)
    )
  );
  results.forEach(raw => {
    const art = normalizeArticle(raw);
    if (!art) return;
    ARTICLES[art.id] = art;
    const catKey = art.cat;
    if (!CATEGORIES[catKey]) CATEGORIES[catKey] = { icon: '📂', label: art.catLabel || catKey, articles: [] };
    if (!CATEGORIES[catKey].articles.includes(art.id)) CATEGORIES[catKey].articles.push(art.id);
    LOADED_CATS.add(catKey);
  });
  buildTrendingBar();
  return Object.keys(ARTICLES).length > 0;
}

async function loadCategoryArticles(cat) {
  if (LOADED_CATS.has(cat)) return true;

  const navItem = NAV_STRUCTURE.find(n => n.key === cat);
  const navSubKeys = (navItem && navItem.subs) ? navItem.subs.map(s => s.key) : [];
  const prefixSubKeys = Object.keys(CATEGORIES).filter(k =>
    k !== cat && (k.startsWith(cat + '_') || k.endsWith('_' + cat))
  );
  const allSubKeys = [...new Set([...navSubKeys, ...prefixSubKeys])];
  const catsToFetch = [cat, ...allSubKeys].filter(k => !LOADED_CATS.has(k));
  if (!catsToFetch.length) { LOADED_CATS.add(cat); return true; }

  // JS లో category filter — files.php?category= replace
  const allFiles = new Set();
  await Promise.all(
    catsToFetch.map(async k => {
      try {
        const data = await getFilesByCategory(k);
        (data.files || []).forEach(f => allFiles.add(f));
      } catch (e) {}
    })
  );

  if (!allFiles.size) { catsToFetch.forEach(k => LOADED_CATS.add(k)); return true; }

  const results = await Promise.all(
    [...allFiles].map(fname =>
      fetch('data/' + fname).then(r => r.ok ? r.json() : null).catch(() => null)
    )
  );
  results.forEach(raw => {
    const art = normalizeArticle(raw);
    if (!art) return;
    if (!ARTICLES[art.id]) ARTICLES[art.id] = art;
    const catKey = art.cat;
    if (!CATEGORIES[catKey]) CATEGORIES[catKey] = { icon: '📂', label: art.catLabel || catKey, articles: [] };
    if (!CATEGORIES[catKey].articles.includes(art.id)) CATEGORIES[catKey].articles.push(art.id);
  });
  catsToFetch.forEach(k => LOADED_CATS.add(k));
  LOADED_CATS.add(cat);
  return true;
}