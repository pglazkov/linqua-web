import { MockFirestore } from './mock-firestore';

export interface MockNode {
  readonly fullPath: string;
  readonly parent: MockNode | undefined;
  readonly root: MockFirestore;
  readonly path: string;
}
