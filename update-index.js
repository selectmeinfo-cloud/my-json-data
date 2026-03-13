// update-index.js
// Usage: node update-index.js
// data/ folder లో అన్ని .json files scan చేసి
// published_date బట్టి sort చేసి root లో index.json update చేస్తుంది

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, 'data');   // articles ఇక్కడ
const INDEX_FILE = path.join(__dirname, 'index.json'); // root లో
const SKIP       = new Set(['index.json', 'manifest.json']);

function getDate(fpath) {
  try {
    const d = JSON.parse(fs.readFileSync(fpath, 'utf-8'));
    return d.published_date || '';
  } catch {
    return '';
  }
}

// data/ folder లో అన్ని .json files తీసుకో
const files = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && !SKIP.has(f));

// published_date బట్టి latest first sort
files.sort((a, b) => {
  const da = getDate(path.join(DATA_DIR, a));
  const db = getDate(path.join(DATA_DIR, b));
  return db.localeCompare(da);
});

// root లో index.json write చేయి
fs.writeFileSync(INDEX_FILE, JSON.stringify({ files }, null, 2), 'utf-8');

console.log(`✅ index.json updated — ${files.length} files:`);
files.forEach(f => {
  const date = getDate(path.join(DATA_DIR, f)) || 'no date';
  console.log(`   ${f}  (${date})`);
});