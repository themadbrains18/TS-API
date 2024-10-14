import { Client, Storage } from 'node-appwrite';

const appwriteEndpoint = process.env.APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID;
const appwriteApiKey = process.env.APPWRITE_API_KEY;

if (!appwriteEndpoint || !appwriteProjectId || !appwriteApiKey) {
  throw new Error('Missing Appwrite environment variables');
}

const client = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setKey(appwriteApiKey);

const storage = new Storage(client);

export { storage };
