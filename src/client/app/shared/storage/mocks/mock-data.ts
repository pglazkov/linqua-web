import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import * as firebase from 'firebase/app';
import { MockFirestore } from './mock-firestore';

export interface MockEntryDocument {
  addedOn: number;
  originalText: string;
  translation: string | undefined;
  updatedOn: number;
}

export interface MockEntriesCollection {
  [key: string]: MockEntryDocument | undefined;
}

export interface MockUserDocument {
  'entries': MockEntriesCollection;
  'entries-archive': MockEntriesCollection;
  'entries-archive-count': number | undefined;
  'entries-count': number | undefined;
}

export interface MockUsersCollection {
  [key: string]: MockUserDocument | undefined;
}

export interface MockRootDocument {
  'users': MockUsersCollection;
}

export class MockData {
  private _firestoreRoot$ = new ReplaySubject<MockRootDocument>(1);
  private _loggedInUser$ = new ReplaySubject<firebase.UserInfo>(1);

  firestore: MockFirestore;

  get rootDocument(): Observable<MockRootDocument> {
    return this._firestoreRoot$;
  }

  get loggedInUser(): Observable<firebase.UserInfo> {
    return this._loggedInUser$;
  }

  initFirestore(data: MockRootDocument) {
    this._firestoreRoot$.next(this.createFirestoreNode(data));
  }

  loginAs(user: firebase.UserInfo) {
    this._loggedInUser$.next(user);
  }

  emit() {
    this.firestore.emit();
  }

  emitAll() {
    this.firestore.emitAll();
  }

  private createFirestoreNode(rawData: any): any {
    const result: any = {};

    for (const [key, value] of Object.entries(rawData)) {
      if (typeof value === 'object') {
        result[key] = new BehaviorSubject<any>(this.createFirestoreNode(value));
      }
      else {
        result[key] = value;
      }
    }

    return result;
  }
}
