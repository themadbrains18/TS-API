import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../config/firebase.config';
import { v4 as uuidv4 } from 'uuid';
// Initialize Firebase app
const app = initializeApp(firebaseConfig.firebaseConfig);
const storage = getStorage(app);

// Upload file to Firebase Storage
export async function uploadFileToFirebase(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) throw new Error('No file provided.');
    // Generate a unique file name
    const uniqueFileName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);

    const snapshot = await uploadBytes(storageRef, file.buffer, { contentType: file.mimetype });
    return getDownloadURL(snapshot.ref);
}

// Delete file from Firebase Storage
export async function deleteFileFromFirebase(fileUrl: string): Promise<void> {
    if (!fileUrl) throw new Error('No file URL provided.');

    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
}

// Utility to extract file reference from a Firebase URL
export function extractFileRefFromUrl(imageUrl: string): string {
    const parts = imageUrl.split('/');
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
