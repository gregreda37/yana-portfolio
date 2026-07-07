const admin = require('../functions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'yana-f9a11' });
const db = admin.firestore();

const OLD_TITLE = 'Sales insights & strategy.';
const OLD_DESC  = 'Practical frameworks and lessons from years in the field.';
const NEW_TITLE = 'Thoughts worth sharing.';
const NEW_DESC  = 'A mix of lessons, perspectives, and ideas from my work and life.';

async function run() {
  const usernamesSnap = await db.collection('usernames').get();
  const uids = usernamesSnap.docs.map(d => d.data().uid).filter(Boolean);
  console.log(`Found ${uids.length} user(s)\n`);

  for (const uid of uids) {
    const ref  = db.doc(`users/${uid}/portfolio/blog`);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`  ${uid}: no blog doc, skipping`); continue; }

    const data = snap.data();
    const updates = {};

    if (!data.sectionLabel) updates.sectionLabel = 'Insights';
    if (!data.sectionTitle || data.sectionTitle === OLD_TITLE) updates.sectionTitle = NEW_TITLE;
    if (!data.sectionDescription || data.sectionDescription === OLD_DESC) updates.sectionDescription = NEW_DESC;

    if (!Object.keys(updates).length) {
      console.log(`  ${uid}: already customised, skipping`);
      continue;
    }

    await ref.update(updates);
    console.log(`  ${uid}: updated →`, updates);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
