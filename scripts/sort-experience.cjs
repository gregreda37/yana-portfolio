// One-time migration: sort all users' experience.jobs by end date, descending.
// Run from the repo root: node scripts/sort-experience.js

const admin = require('../functions/node_modules/firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'yana-f9a11' });
const db = admin.firestore();

const MONTH_MAP = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
  january:0, february:1, march:2, april:3, june:5, july:6, august:7,
  september:8, october:9, november:10, december:11,
};

function periodEndMs(period) {
  if (!period) return 0;
  const s = period.toLowerCase().trim();
  if (/present|current|now/.test(s)) return 99999999999999;
  const parts = s.split(/\s*[–—\-]\s*/);
  const end = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();
  const monthYear = end.match(/([a-z]+)\.?\s+(\d{4})/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1].slice(0, 3)];
    const year = parseInt(monthYear[2], 10);
    if (month !== undefined && !isNaN(year)) return new Date(year, month).getTime();
  }
  const yearOnly = end.match(/\b(\d{4})\b/);
  if (yearOnly) return new Date(parseInt(yearOnly[1], 10), 11, 31).getTime();
  return 0;
}

async function run() {
  const usernamesSnap = await db.collection('usernames').get();
  const uids = usernamesSnap.docs.map(d => d.data().uid).filter(Boolean);
  console.log(`Found ${uids.length} user(s)`);

  for (const uid of uids) {
    const ref = db.doc(`users/${uid}/portfolio/experience`);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`  ${uid}: no experience doc, skipping`); continue; }

    const data = snap.data();
    const jobs = data.jobs ?? [];
    if (!jobs.length) { console.log(`  ${uid}: no jobs, skipping`); continue; }

    const sorted = [...jobs].sort((a, b) => periodEndMs(b.period) - periodEndMs(a.period));

    const changed = sorted.some((j, i) => j !== jobs[i]);
    if (!changed) { console.log(`  ${uid}: already in order`); continue; }

    console.log(`  ${uid}: reordering ${jobs.length} jobs`);
    sorted.forEach((j, i) => console.log(`    ${i + 1}. ${j.period ?? '(no period)'} — ${j.role} @ ${j.company}`));

    await ref.update({ jobs: sorted });
    console.log(`  ${uid}: saved`);
  }

  console.log('Done.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
