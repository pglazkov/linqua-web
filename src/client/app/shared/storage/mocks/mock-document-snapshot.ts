import * as firebase from 'firebase/app';

export class MockDocumentSnapshot {
  constructor(public readonly id: string, private readonly rawData: any, private readonly fromCache = false) {
  }

  readonly exists = true;

  get metadata(): any {
    return {
      fromCache: this.fromCache
    };
  }

  data(options?: firebase.firestore.SnapshotOptions): any {
    return this.rawData;
  }
}
