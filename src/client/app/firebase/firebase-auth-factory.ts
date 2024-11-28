import { environment } from 'environments/environment';
import { FirebaseApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';

export const firebaseAuthFactory = (firebaseApp: FirebaseApp): Auth => {
  const auth = getAuth(firebaseApp);

  if (environment.useFirebaseEmulators) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }

  return auth;
};
