import { FirebaseApp } from 'ng-firebase-lite';
import { MockData } from './mock-data';
import { MockAuth } from './mock-auth';
import { MockFirestore } from './mock-firestore';
import * as firebase from 'firebase';

export class MockFirebaseApp implements FirebaseApp {
  constructor(private mockData: MockData) {
    const authMock = new MockAuth(mockData.loggedInUser);
    const mockFirestore = new MockFirestore(mockData.rootDocument);

    this.auth = () => authMock as any as firebase.auth.Auth;
    this.firestore = () => mockFirestore as any as firebase.firestore.Firestore;
  }

  auth: () => firebase.auth.Auth;
  database: () => firebase.database.Database = MockFirebaseApp.notImplemented;
  delete: () => Promise<any> = MockFirebaseApp.notImplemented;
  firestore: () => firebase.firestore.Firestore;
  messaging: () => firebase.messaging.Messaging = MockFirebaseApp.notImplemented;
  name = 'linqua';
  options: {} = {};
  storage: () => firebase.storage.Storage = MockFirebaseApp.notImplemented;

  private static notImplemented: () => any = () => {
    throw new Error('Not implemented');
  }
}
