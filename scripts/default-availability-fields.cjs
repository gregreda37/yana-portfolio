// Sets availabilityTitle and availabilityButton defaults for all users who are missing them.
const admin = require('../functions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'yana-f9a11' });
const db = admin.firestore();

async function run() {
  const usernamesSnap = await db.collection('usernames').get();
  const uids = usernamesSnap.docs.map(d => d.data().uid).filter(Boolean);
  console.log(`Found ${uids.length} user(s)\n`);

  for (const uid of uids) {
    const ref  = db.doc(`users/${uid}/portfolio/profile`);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`  ${uid}: no profile doc`); continue; }

    const data = snap.data();
    const updates = {};
    if (!data.availabilityTitle)  updates.availabilityTitle  = 'Open to Connect';
    if (!data.availabilityButton) updates.availabilityButton = "Let's Talk";

    if (Object.keys(updates).length === 0) {
      console.log(`  ${uid}: already has fields, skipping`);
      continue;
    }

    await ref.update(updates);
    console.log(`  ${uid}: set`, updates);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
