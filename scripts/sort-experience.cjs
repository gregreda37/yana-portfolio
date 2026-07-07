// Migration: parse free-text period strings into structured fields + re-sort.
// Run: node scripts/sort-experience.cjs

const admin = require('../functions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'yana-f9a11' });
const db = admin.firestore();

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MONTH_MAP = {
  jan:'Jan',feb:'Feb',mar:'Mar',apr:'Apr',may:'May',jun:'Jun',
  jul:'Jul',aug:'Aug',sep:'Sep',oct:'Oct',nov:'Nov',dec:'Dec',
  january:'Jan',february:'Feb',march:'Mar',april:'Apr',june:'Jun',
  july:'Jul',august:'Aug',september:'Sep',october:'Oct',november:'Nov',december:'Dec',
};

function parsePart(str) {
  str = str.trim().toLowerCase();
  if (/present|current|now/.test(str)) return { present: true };
  const monthYear = str.match(/([a-z]+)\.?\s+(\d{4})/);
  if (monthYear) return { month: MONTH_MAP[monthYear[1]] ?? '', year: monthYear[2] };
  const yearOnly = str.match(/\b(\d{4})\b/);
  if (yearOnly) return { month: '', year: yearOnly[1] };
  return null;
}

function parsePeriod(period) {
  if (!period) return null;
  const parts = period.trim().split(/\s*[–—\-]\s*/);
  const start = parsePart(parts[0]);
  const end   = parts.length > 1 ? parsePart(parts[parts.length - 1]) : null;
  if (!start) return null;
  return {
    startMonth: start.month ?? '',
    startYear:  start.year  ?? '',
    endPresent: end?.present ?? false,
    endMonth:   end?.present ? '' : (end?.month ?? ''),
    endYear:    end?.present ? '' : (end?.year  ?? ''),
  };
}

function computePeriod(job) {
  if (!job.startYear && !job.startMonth) return job.period ?? '';
  const start = [job.startMonth, job.startYear].filter(Boolean).join(' ');
  const end   = job.endPresent ? 'Present' : [job.endMonth, job.endYear].filter(Boolean).join(' ');
  return end ? `${start} – ${end}` : start;
}

function jobEndMs(job) {
  if (job.endPresent) return 99999999999999;
  if (job.endYear) {
    const mi = MONTHS.indexOf(job.endMonth);
    return new Date(parseInt(job.endYear, 10), mi >= 0 ? mi : 11).getTime();
  }
  return 0;
}

async function run() {
  const usernamesSnap = await db.collection('usernames').get();
  const uids = usernamesSnap.docs.map(d => d.data().uid).filter(Boolean);
  console.log(`Found ${uids.length} user(s)\n`);

  for (const uid of uids) {
    const ref  = db.doc(`users/${uid}/portfolio/experience`);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`  ${uid}: no experience doc`); continue; }

    const jobs = snap.data().jobs ?? [];
    if (!jobs.length) { console.log(`  ${uid}: no jobs`); continue; }

    const migrated = jobs.map(job => {
      if (job.startYear || job.startMonth) {
        // Already structured — just recompute the display string
        return { ...job, period: computePeriod(job) };
      }
      const parsed = parsePeriod(job.period);
      if (!parsed) return job;
      return { ...job, ...parsed, period: computePeriod({ ...job, ...parsed }) };
    });

    const sorted = [...migrated].sort((a, b) => jobEndMs(b) - jobEndMs(a));

    console.log(`  ${uid}: ${sorted.length} job(s)`);
    sorted.forEach((j, i) =>
      console.log(`    ${i + 1}. ${j.period || '(no period)'}  —  ${j.role} @ ${j.company}`)
    );

    await ref.update({ jobs: sorted });
    console.log(`  saved\n`);
  }

  console.log('Migration complete.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
