import { MockNode } from './mock-node';
import { ObservableUtil } from './observable-util';
import { MockFirestore } from './mock-firestore';

export abstract class MockNodeBase implements MockNode {
  protected constructor(protected readonly data: any) {
    if (!data) {
      throw new Error(`Data for node ${this.fullPath} cannot be undefined.`);
    }
  }

  get fullPath(): string {
    let parent = this.parent;

    const segments: string[] = [];

    segments.push(this.path);

    while (parent) {
      segments.unshift(parent.path);

      parent = parent.parent;
    }

    return segments.join('/');
  }

  get root(): MockFirestore {
    if (this instanceof MockFirestore) {
      return this;
    }

    if (this.parent) {
      return this.parent.root;
    }

    throw new Error('This node is not root and does not have a parent. Something is not right here...');
  }

  abstract readonly parent: MockNode | undefined;
  abstract readonly path: string;

  protected getChildData(path: string): any {
    return ObservableUtil.getChildData(this.data, path);
  }

  protected emitSnapshot(callback: (snapshot: any) => void, snapshotFactory: (fromCache: boolean) => any) {
    const fromCache = this.root.isPersistanceEnabled;

    this.root.__enqueueEmit__(() => callback(snapshotFactory(fromCache)));

    if (fromCache) {
      this.root.__enqueueEmit__(() => callback(snapshotFactory(false)));
    }
  }
}
