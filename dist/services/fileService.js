"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToFirebase = uploadFileToFirebase;
exports.deleteFileFromFirebase = deleteFileFromFirebase;
exports.extractFileRefFromUrl = extractFileRefFromUrl;
const storage_1 = require("firebase/storage");
const app_1 = require("firebase/app");
const firebase_config_1 = __importDefault(require("../config/firebase.config"));
const uuid_1 = require("uuid");
// Initialize Firebase app
const app = (0, app_1.initializeApp)(firebase_config_1.default.firebaseConfig);
const storage = (0, storage_1.getStorage)(app);
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
async function uploadFileToFirebase(file, folder) {
    if (!file)
        throw new Error('No file provided.');
    // Generate a unique file name
    const uniqueFileName = `${Date.now()}-${(0, uuid_1.v4)()}-${file.originalname}`;
    const storageRef = (0, storage_1.ref)(storage, `${folder}/${uniqueFileName}`);
    const snapshot = await (0, storage_1.uploadBytes)(storageRef, file.buffer, { contentType: file.mimetype });
    return (0, storage_1.getDownloadURL)(snapshot.ref);
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
async function deleteFileFromFirebase(fileUrl) {
    if (!fileUrl)
        throw new Error('No file URL provided.');
    const fileRef = (0, storage_1.ref)(storage, fileUrl);
    await (0, storage_1.deleteObject)(fileRef);
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
function extractFileRefFromUrl(imageUrl) {
    const parts = imageUrl.split('/');
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
