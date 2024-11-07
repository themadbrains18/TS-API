// src/config/firebase.config.ts
import * as dotenv from 'dotenv';
dotenv.config();

/*
 * Interface for Firebase configuration to ensure proper typing.
 * 
 * This interface defines the structure and required fields for the Firebase configuration object.
 * It ensures that the object passed to initialize Firebase has all the necessary properties and types.
 * The fields include:
 * - apiKey: The API key for Firebase authentication.
 * - authDomain: The authentication domain for Firebase.
 * - projectId: The unique project identifier for Firebase.
 * - storageBucket: The storage bucket URL for Firebase storage.
 * - messagingSenderId: The sender ID for Firebase Cloud Messaging.
 * - appId: The app identifier for Firebase.
 * - measurementId: The measurement ID for Firebase analytics.
 * 
 * This interface helps with TypeScript type safety and improves code clarity.
 */
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

/*
 * Function to safely load Firebase configuration from environment variables.
 * 
 * This function retrieves the Firebase configuration from the environment variables
 * (e.g., API_KEY, AUTH_DOMAIN, etc.) and ensures that all required fields are present.
 * 
 * @returns An object with the correct structure for Firebase configuration (FirebaseConfig interface).
 */
const getFirebaseConfig = (): FirebaseConfig => {
    const {
        API_KEY,
        AUTH_DOMAIN,
        PROJECT_ID,
        STORAGE_BUCKET,
        MESSAGING_SENDER_ID,
        APP_ID,
        MEASUREMENT_ID,
    } = process.env;

    // Check if any required environment variable is missing
    if (!API_KEY || !AUTH_DOMAIN || !PROJECT_ID || !STORAGE_BUCKET || !MESSAGING_SENDER_ID || !APP_ID || !MEASUREMENT_ID) {
        throw new Error('Missing Firebase environment configuration.');
    }

    return {
        apiKey: API_KEY,
        authDomain: AUTH_DOMAIN,
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
        messagingSenderId: MESSAGING_SENDER_ID,
        appId: APP_ID,
        measurementId: MEASUREMENT_ID,
    };
};

/**
 * Export the Firebase config object
 */
export default {
    firebaseConfig: getFirebaseConfig(),
};
