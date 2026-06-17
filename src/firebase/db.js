import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
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

// ── Contact messages ─────────────────────────────────────────────────────────

export async function submitContactMessage(portfolioUid, { name, email, subject, message }) {
  await addDoc(collection(db, 'users', portfolioUid, 'contactMessages'), {
    name,
    email,
    subject,
    message,
    sentAt: serverTimestamp(),
    read: false,
  });
}

export async function getContactMessages(uid) {
  const q = query(collection(db, 'users', uid, 'contactMessages'), orderBy('sentAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markContactRead(uid, messageId) {
  await updateDoc(doc(db, 'users', uid, 'contactMessages', messageId), { read: true });
}

// ── Resume requests ─────────────────────────────────────────────────────────

export async function submitResumeRequest(portfolioUid, { requesterName, requesterEmail, message }) {
  await addDoc(collection(db, 'users', portfolioUid, 'resumeRequests'), {
    requesterName,
    requesterEmail,
    message: message || '',
    requestedAt: serverTimestamp(),
    status: 'pending',
  });
}

export async function getResumeRequests(uid) {
  const q = query(collection(db, 'users', uid, 'resumeRequests'), orderBy('requestedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateResumeRequest(uid, requestId, updates) {
  await updateDoc(doc(db, 'users', uid, 'resumeRequests', requestId), updates);
}
