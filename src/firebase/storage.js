import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export async function uploadAsset(uid, file, folder = 'assets') {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}.${ext}`;
  const storageRef = ref(storage, `users/${uid}/${folder}/${filename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
