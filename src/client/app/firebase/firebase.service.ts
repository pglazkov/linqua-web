import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { FirebaseApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';
import { firebaseAppToken } from 'ng-firebase-lite';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly fba = inject<FirebaseApp>(firebaseAppToken);

  private _auth: Auth | undefined;
  private _firestore: Firestore | undefined;

  get auth(): Auth {
    if (!this._auth) {
      this._auth = getAuth(this.fba);

      if (environment.useFirebaseEmulators) {
        connectAuthEmulator(this._auth, 'http://localhost:9099');
      }
    }

    return this._auth;
  }

  get firestore(): Firestore {
    if (!this._firestore) {
      initializeFirestore(this.fba, {
        // Enable persistence only when not using emulator because emulated database is cleared automatically, but local cache is not, so there might be discrepancies.
        // See a note here: https://firebase.google.com/docs/emulator-suite/connect_firestore#android_apple_platforms_and_web_sdks
        localCache: environment.useFirebaseEmulators ? memoryLocalCache() : persistentLocalCache(),
      });

      this._firestore = getFirestore(this.fba);

      if (environment.useFirebaseEmulators) {
        connectFirestoreEmulator(this._firestore, 'localhost', 5002);
      }
    }

    return this._firestore;
  }
}
