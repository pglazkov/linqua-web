import * as firebase from 'firebase/app';
import { MockNodeBase } from './mock-node-base';
import { MockNode } from './mock-node';
import { MockCollectionReference } from './mock-collection-reference';
import { MockDocumentSnapshot } from './mock-document-snapshot';

export class MockDocumentReference extends MockNodeBase {
  constructor(public readonly parent: MockNode | undefined,
              public path: string, data: any,
              private deleteFunc: (key: string) => Promise<void>) {

    super(data);
  }

  collection(collectionPath: string): any {
    return new MockCollectionReference(this, collectionPath, this.getChildData(collectionPath));
  }

  onSnapshot(...args: any[]): () => void {
    let callback: (snapshot: any) => void;

    callback = args.length > 1 ? args[1] : args[0];

    if (this.data.subscribe) {
      const subscription = this.data.subscribe((x: any) => {
        this.emitSnapshot(callback, (fromCache => new MockDocumentSnapshot(this.path, x, fromCache)));
      });

      return () => subscription.unsubscribe();
    }
    else {
      callback(new MockDocumentSnapshot(this.path, this.data));
    }

    return () => {
    };
  }

  get(): Promise<MockDocumentSnapshot> {
    return new Promise<MockDocumentSnapshot>((resolve, reject) => {
      let unsubscribe = () => {
      };

      unsubscribe = this.onSnapshot((snapshot: MockDocumentSnapshot) => {
        unsubscribe();
        resolve(snapshot);
      });
    });
  }

  set(data: any, options?: firebase.firestore.SetOptions): Promise<void> {
    if (this.data.next) {
      this.data.next(data);
    }
    else {
      Object.assign(this.data, data);
    }

    return Promise.resolve();
  }

  delete(): Promise<void> {
    return this.deleteFunc(this.path);
  }
}
