import { MockDocumentSnapshot } from './mock-document-snapshot';

export class MockQuerySnapshot {
  constructor(private readonly docs: MockDocumentSnapshot[], private readonly fromCache = false) {
  }

  get metadata(): any {
    return {
      fromCache: this.fromCache
    };
  }
}
