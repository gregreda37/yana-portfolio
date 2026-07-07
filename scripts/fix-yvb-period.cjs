const admin = require('../functions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'yana-f9a11' });
const db = admin.firestore();

async function run() {
  const uid = 'MYI8QXik8PXlg5bQgF5BmYFKDmR2';
  const ref = db.doc(`users/${uid}/portfolio/experience`);
  const snap = await ref.get();
  const jobs = snap.data().jobs ?? [];

  const updated = jobs.map(j => {
    if (j.company !== 'YVB Consulting LLC') return j;
    return { ...j, startMonth: 'May', startYear: '2026', endPresent: true, endMonth: '', endYear: '', period: 'May 2026 – Present' };
  });

  // Re-sort: Present jobs first
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const endMs = j => {
    if (j.endPresent) return 99999999999999;
    if (j.endYear) { const mi = MONTHS.indexOf(j.endMonth); return new Date(parseInt(j.endYear, 10), mi >= 0 ? mi : 11).getTime(); }
    return 0;
  };
  const sorted = [...updated].sort((a, b) => endMs(b) - endMs(a));

  sorted.forEach((j, i) => console.log(`  ${i+1}. ${j.period}  —  ${j.role} @ ${j.company}`));
  await ref.update({ jobs: sorted });
  console.log('Saved.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
