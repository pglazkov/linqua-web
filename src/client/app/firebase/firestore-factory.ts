import { environment } from 'environments/environment';
import { FirebaseApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';

export const firestoreFactory = (firebaseApp: FirebaseApp): Firestore => {
  initializeFirestore(firebaseApp, {
    // Enable persistence only when not using emulator because emulated database is cleared automatically, but local cache is not, so there might be discrepancies.
    // See a note here: https://firebase.google.com/docs/emulator-suite/connect_firestore#android_apple_platforms_and_web_sdks
    localCache: environment.useFirebaseEmulators ? memoryLocalCache() : persistentLocalCache(),
  });

  const firestore = getFirestore(firebaseApp);

  if (environment.useFirebaseEmulators) {
    connectFirestoreEmulator(firestore, 'localhost', 5002);
  }

  return firestore;
};
