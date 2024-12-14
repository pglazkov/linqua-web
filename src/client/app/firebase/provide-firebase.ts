import { NgZone, Provider } from '@angular/core';
import { FirebaseOptions } from 'firebase/app';

import { firebaseAppConfigToken } from './firebase-app-config-token';
import { firebaseAppFactory } from './firebase-app-factory';
import { firebaseAuthFactory } from './firebase-auth-factory';
import { firebaseAppToken, firebaseAuthToken, firestoreToken, functionsToken } from './firebase-injection-tokens';
import { firestoreFactory } from './firestore-factory';
import { functionsFactory } from './functions-factory';

export function provideFirebase(config: FirebaseOptions): Provider[] {
  return [
    {
      provide: firebaseAppConfigToken,
      useValue: config,
    },
    {
      provide: firebaseAppToken,
      useFactory: firebaseAppFactory,
      deps: [firebaseAppConfigToken, NgZone],
    },
    {
      provide: firebaseAuthToken,
      useFactory: firebaseAuthFactory,
      deps: [firebaseAppToken],
    },
    {
      provide: firestoreToken,
      useFactory: firestoreFactory,
      deps: [firebaseAppToken],
    },
    {
      provide: functionsToken,
      useFactory: functionsFactory,
      deps: [firebaseAppToken],
    },
  ];
}
