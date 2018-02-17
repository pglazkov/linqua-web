import * as firebase from 'firebase/app';
import { InjectionToken, NgModule, NgZone } from '@angular/core';

export const FirebaseAppConfigToken = new InjectionToken<FirebaseAppConfig>('FirebaseAppConfigToken');

export class FirebaseApp implements firebase.app.App {
  name: string;
  options: {};
  auth: () => firebase.auth.Auth;
  database: () => firebase.database.Database;
  messaging: () => firebase.messaging.Messaging;
  storage: () => firebase.storage.Storage;
  delete: () => Promise<any>;
  firestore: () => firebase.firestore.Firestore;
}

export function _firebaseAppFactory(config: FirebaseAppConfig, zone: NgZone): FirebaseApp {
  return zone.runOutsideAngular(() => {
    return firebase.initializeApp(config) as FirebaseApp;
  });
}

export interface FirebaseAppConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  projectId?: string;
}

export const FirebaseAppProvider = {
  provide: FirebaseApp,
  useFactory: _firebaseAppFactory,
  deps: [ FirebaseAppConfigToken, NgZone ]
};

@NgModule({
  providers: [ FirebaseAppProvider ],
})
export class FirebaseAppModule {
  static initializeApp(config: FirebaseAppConfig) {
    return {
      ngModule: FirebaseAppModule,
      providers: [
        { provide: FirebaseAppConfigToken, useValue: config }
      ]
    };
  }
}
