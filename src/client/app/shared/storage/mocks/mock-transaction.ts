import { MockDocumentReference } from './mock-document-reference';
import { MockDocumentSnapshot } from './mock-document-snapshot';
import * as firebase from 'firebase/app';

export class MockTransaction {
  public readonly operations: Promise<any>[] = [];

  get(documentRef: MockDocumentReference): Promise<MockDocumentSnapshot> {
    return documentRef.get();
  }

  set(documentRef: MockDocumentReference, data: any, options?: firebase.firestore.SetOptions): MockTransaction {
    this.operations.push(documentRef.set(data, options));

    return this;
  }

  delete(documentRef: MockDocumentReference): MockTransaction {
    this.operations.push(documentRef.delete());

    return this;
  }
}
