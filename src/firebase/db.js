import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export async function getSection(uid, section) {
  const snap = await getDoc(doc(db, 'users', uid, 'portfolio', section));
  return snap.exists() ? snap.data() : null;
}

export async function saveSection(uid, section, data) {
  await setDoc(doc(db, 'users', uid, 'portfolio', section), data);
}

export async function getUsername(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data().username ?? null) : null;
}

export async function claimUsername(uid, username) {
  const usernameRef = doc(db, 'usernames', username);
  const existing = await getDoc(usernameRef);
  if (existing.exists()) throw new Error('Username taken');
  await setDoc(doc(db, 'users', uid), { username, createdAt: serverTimestamp() }, { merge: true });
  await setDoc(usernameRef, { uid });
}

export async function getUidByUsername(username) {
  const snap = await getDoc(doc(db, 'usernames', username));
  return snap.exists() ? snap.data().uid : null;
}
