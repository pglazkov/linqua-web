import { MockNodeBase } from './mock-node-base';
import { MockNode } from './mock-node';
import { MockCollectionReference } from './mock-collection-reference';
import { MockDocumentReference } from './mock-document-reference';
import { MockTransaction } from './mock-transaction';

export class MockFirestore extends MockNodeBase {
  private _isPersistanceEnabled = false;
  private _emitQueue: (() => void)[] = [];

  constructor(mockData: any) {
    super(mockData);
  }

  readonly path: string = '';
  readonly parent: MockNode | undefined;

  get isPersistanceEnabled() {
    return this._isPersistanceEnabled;
  }

  collection(collectionPath: string): any {
    return new MockCollectionReference(this, collectionPath, this.getChildData(collectionPath));
  }

  doc(documentPath: string): any {
    return new MockDocumentReference(this, documentPath, this.getChildData(documentPath), this.deleteDocument);
  }

  enablePersistence(): Promise<void> {
    this._isPersistanceEnabled = true;
    return Promise.resolve();
  }

  async runTransaction(updateFunction: (transaction: MockTransaction) => Promise<any>): Promise<any> {
    const tran = new MockTransaction();

    await updateFunction(tran);
    await Promise.all(tran.operations);
  }

  __enqueueEmit__(callback: () => void) {
    this._emitQueue.unshift(callback);
  }

  emit() {
    const emitAction = this._emitQueue.pop();

    if (emitAction) {
      emitAction();
    }
  }

  emitAll() {
    let emitAction = this._emitQueue.pop();

    while (emitAction) {
      emitAction();

      emitAction = this._emitQueue.pop();
    }
  }

  private deleteDocument(key: string): Promise<void> {
    delete this.data[key];

    return Promise.resolve();
  }
}
