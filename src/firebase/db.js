import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

const COL = 'portfolio';

export async function getSection(section) {
  const snap = await getDoc(doc(db, COL, section));
  return snap.exists() ? snap.data() : null;
}

export async function saveSection(section, data) {
  await setDoc(doc(db, COL, section), data);
}
