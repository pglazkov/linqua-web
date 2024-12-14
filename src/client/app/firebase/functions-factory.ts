import { environment } from 'environments/environment';
import { FirebaseApp } from 'firebase/app';
import { connectFunctionsEmulator, Functions, getFunctions } from 'firebase/functions';

export const functionsFactory = (firebaseApp: FirebaseApp): Functions => {
  const functions = getFunctions(firebaseApp);

  if (environment.useFirebaseEmulators) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }

  return functions;
};
