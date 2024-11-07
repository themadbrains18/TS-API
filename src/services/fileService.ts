import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../config/firebase.config';
import { v4 as uuidv4 } from 'uuid';
// Initialize Firebase app
const app = initializeApp(firebaseConfig.firebaseConfig);
const storage = getStorage(app);

/*
 * Uploads a file to Firebase Storage.
 * 
 * @param file - The file to be uploaded (of type Express.Multer.File).
 * @param folder - The folder in Firebase Storage where the file will be saved.
 * 
 * @returns A promise that resolves to the download URL of the uploaded file.
 * 
 * Process:
 * 1. Throws an error if no file is provided.
 * 2. Generates a unique file name by combining the current timestamp, a UUID, and the original file name.
 * 3. Creates a reference to the file in Firebase Storage with the unique file name inside the specified folder.
 * 4. Uploads the file to Firebase Storage using the file buffer and its MIME type.
 * 5. Returns the download URL of the uploaded file from Firebase Storage.
 */
export async function uploadFileToFirebase(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) throw new Error('No file provided.');
    // Generate a unique file name
    const uniqueFileName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);

    const snapshot = await uploadBytes(storageRef, file.buffer, { contentType: file.mimetype });
    return getDownloadURL(snapshot.ref);
}

/*
 * Deletes a file from Firebase Storage.
 * 
 * @param fileUrl - The URL of the file to be deleted from Firebase Storage.
 * 
 * @returns A promise that resolves when the file is successfully deleted.
 * 
 * Process:
 * 1. Throws an error if no file URL is provided.
 * 2. Creates a reference to the file in Firebase Storage using the provided file URL.
 * 3. Deletes the file from Firebase Storage by calling the deleteObject method on the file reference.
 */
export async function deleteFileFromFirebase(fileUrl: string): Promise<void> {
    if (!fileUrl) throw new Error('No file URL provided.');

    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
}

/*
 * Utility to extract the file reference from a Firebase Storage URL.
 * 
 * @param imageUrl - The URL of the file stored in Firebase Storage.
 * 
 * @returns A string representing the file reference in Firebase Storage, which is typically the path to the file within the storage bucket.
 * 
 * Process:
 * 1. Splits the provided image URL by '/' to separate the path components.
 * 2. Extracts and combines the second-to-last and last parts of the URL, which correspond to the file reference in Firebase Storage.
 */
export function extractFileRefFromUrl(imageUrl: string): string {
    const parts = imageUrl.split('/');
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
