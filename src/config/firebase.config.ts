// src/config/firebase.config.ts
import * as dotenv from 'dotenv';
dotenv.config();

// Interface for Firebase config to ensure proper typing
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

// Function to safely load Firebase config
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

// Export the Firebase config object
export default {
    firebaseConfig: getFirebaseConfig(),
};
