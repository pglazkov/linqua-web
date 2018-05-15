import { MockNodeBase } from './mock-node-base';
import { MockNode } from './mock-node';
import uniqueId from 'lodash-es/uniqueId';
import orderBy from 'lodash-es/orderBy';
import take from 'lodash-es/take';
import indexOf from 'lodash-es/indexOf';
import * as firebase from 'firebase';
import { ObservableUtil } from './observable-util';
import { MockDocumentReference } from './mock-document-reference';
import { MockDocumentSnapshot } from './mock-document-snapshot';
import { MockQuerySnapshot } from './mock-query-snapshot';

export class MockCollectionReference extends MockNodeBase {

  private transforms: ((items: any[]) => any[])[] = [];

  constructor(public readonly parent: MockNode | undefined, public readonly path: string, data: any) {
    super(data);
  }

  doc(documentPath: string): any {
    return new MockDocumentReference(this, documentPath, this.getChildData(documentPath), this.deleteDocument);
  }

  collection(collectionPath: string): any {
    return new MockCollectionReference(this, collectionPath, this.getChildData(collectionPath));
  }

  add(data: any): any {
    const id = uniqueId();

    this.data[id] = data;

    return Promise.resolve(new MockDocumentReference(this, id, data, this.deleteDocument));
  }

  orderBy(fieldPath: string | firebase.firestore.FieldPath, directionStr?: firebase.firestore.OrderByDirection): firebase.firestore.Query {
    this.transforms.push((items) => {
      return orderBy(items, [fieldPath], [directionStr || 'asc']);
    });

    return this as any;
  }

  limit(limit: number): firebase.firestore.Query {
    this.transforms.push((items) => {
      return take(items, limit);
    });

    return this as any;
  }

  startAt(snapshot: firebase.firestore.DocumentSnapshot): firebase.firestore.Query {
    this.transforms.push((items) => {
      const startIndex = indexOf(items, snapshot.data());

      return items.slice(startIndex);
    });

    return this as any;
  }

  onSnapshot(...args: any[]): () => void {
    let callback: (snapshot: any) => void;

    callback = args.length > 1 ? args[1] : args[0];

    const createSnapshot = (data: any, fromCache: boolean) => {
      const keys = Object.keys(data);

      let values = keys.filter(k => k !== '__metadata__' && data.hasOwnProperty(k)).map(k => {
        let result: any;

        if (data[k].getValue) {
          result = data[k].getValue();
        }
        else {
          result = data[k];
        }

        result['__id__'] = k;

        return result;
      });

      for (const transform of this.transforms) {
        values = transform(values);
      }

      return new MockQuerySnapshot(values.map(v => new MockDocumentSnapshot(v['__id__'], v, fromCache)), fromCache);
    };

    if (ObservableUtil.isObservable(this.data)) {
      const subscription = this.data.subscribe(x => {
        this.emitSnapshot(callback, (fromCache) => createSnapshot(x, fromCache));
      });

      return () => subscription.unsubscribe();
    }
    else {
      callback(createSnapshot(this.data, false));
    }

    return () => {
    };
  }

  private deleteDocument(key: string): Promise<void> {
    delete this.data[key];

    return Promise.resolve();
  }
}
