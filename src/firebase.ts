import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it, passing the custom firestoreDatabaseId if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
