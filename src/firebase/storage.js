import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export async function uploadAsset(uid, file, folder = 'assets') {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}.${ext}`;
  const storageRef = ref(storage, `users/${uid}/${folder}/${filename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export function uploadVideo(uid, file, onProgress) {
  const storagePath = `users/${uid}/video/intro`;
  const storageRef = ref(storage, storagePath);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on(
      'state_changed',
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, storagePath });
        } catch (e) { reject(e); }
      }
    );
  });
}

export async function deleteStorageFile(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    if (e.code !== 'storage/object-not-found') throw e;
  }
}
