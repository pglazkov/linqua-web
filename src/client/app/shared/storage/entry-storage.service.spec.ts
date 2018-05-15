import { async, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { EntriesResult, EntryStorageService, LearnedEntriesStats } from './entry-storage.service';
import { FirebaseApp } from 'ng-firebase-lite';
import { AuthService } from '../auth/auth.service';
import { MockData, MockEntriesCollection, MockFirebaseApp, MockRootDocument } from './mocks';

import uniqueId from 'lodash-es/uniqueId';
import { MockFirestore } from './mocks/mock-firestore';
import { Entry } from '../model';

export function mockFirebaseAppFactory(mockData: MockData): FirebaseApp {
  const mockFirestoreApp = new MockFirebaseApp(mockData);

  mockData.firestore = mockFirestoreApp.firestore() as any as MockFirestore;

  return mockFirestoreApp;
}

const testUser = {
  uid: 'test-user',
  providerId: 'google',
  displayName: '',
  email: '',
  phoneNumber: '',
  photoURL: ''
};

function createTestUserData(entries: MockEntriesCollection | Entry[]): MockRootDocument {
  const entriesFirebaseCollectionObject = Array.isArray(entries) ? createEntryCollection(...entries) : entries;

  return {
    'users': {
      'test-user': {
        'entries': entriesFirebaseCollectionObject,
        'entries-archive': {},
        'entries-count': Object.getOwnPropertyNames(entriesFirebaseCollectionObject).length,
        'entries-archive-count': 0
      }
    }
  };
}

function genEntry(addedOnMinutesOffset?: number): Entry {
  const id = uniqueId('doc_');

  const addedOn = new Date(currentDate);

  if (addedOnMinutesOffset) {
    addedOn.setMinutes(addedOn.getMinutes() + addedOnMinutesOffset);
  }

  return new Entry({
    id: id,
    addedOn: addedOn,
    updatedOn: addedOn,
    originalText: 'test',
    translation: 'test'
  });
}

function createEntryCollection(...entries: Entry[]): MockEntriesCollection {
  const result: MockEntriesCollection = {};

  for (const entry of entries) {
    result[entry.id] = {
      addedOn: entry.addedOn.getTime(),
      updatedOn: entry.addedOn.getTime(),
      originalText: entry.originalText,
      translation: entry.translation
    };
  }

  return result;
}

const currentDate = new Date(2018, 4, 1, 12, 0, 0, 0);

const todayMorning = new Date(currentDate);
todayMorning.setHours(8);

const todayAfternoon = new Date(currentDate);
todayAfternoon.setHours(13);

const todayEvening = new Date(currentDate);
todayEvening.setHours(18);

interface PageVerificationSpec {
  expectedPageStart: Entry;
  expectedPageEnd: Entry;
  expectedDocCount: number;
}

describe('EntryStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        AuthService,
        EntryStorageService,
        MockData,
        { provide: FirebaseApp, useFactory: mockFirebaseAppFactory, deps: [MockData] }
      ]
    });
  });

  it('getEntriesStream - should emit twice - fromCache=true,false', (done: any) => {
    inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {
      mockData.loginAs(testUser);

      mockData.initFirestore(createTestUserData([
        genEntry()
      ]));

      const results: EntriesResult[] = [];

      service.getEntriesStream().subscribe(entries => {
        results.push(entries);

        if (results.length === 2) {
          expect(results.length).toBe(2);
          expect(results[0].fromCache).toBe(true);
          expect(results[1].fromCache).toBe(false);
          done();
        }
      }, (e) => {
        fail(e);
      });

      mockData.emitAll();

    })();
  });

  it('getEntriesStream - paging', async(inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {

    mockData.loginAs(testUser);

    const page1Doc1 = genEntry();
    const page1Doc2 = genEntry(-2);
    const page1Doc3 = genEntry(-3);

    const page2Doc1 = genEntry(-4);
    const page2Doc2 = genEntry(-5);
    const page2Doc3 = genEntry(-6);

    const page3Doc1 = genEntry(-7);
    const page3Doc2 = genEntry(-8);

    mockData.initFirestore(createTestUserData([
      // Page 1
      page1Doc1, page1Doc2, page1Doc3,

      // Page 2
      page2Doc1, page2Doc2, page2Doc3,

      // Page 3
      page3Doc1, page3Doc2
    ]));

    const pageSize = 3;

    const verifyPage = (result: EntriesResult, spec: PageVerificationSpec) => {
      expect(result.entries.length).toBe(spec.expectedDocCount);

      const firstEntryId = result.entries[0].id;
      const lastEntryId = result.entries[result.entries.length - 1].id;

      expect(firstEntryId)
        .toBe(spec.expectedPageStart.id, `Expected page to start with ${JSON.stringify(spec.expectedPageStart)}`);

      expect(lastEntryId)
        .toBe(spec.expectedPageEnd.id, `Expected page to end with ${JSON.stringify(spec.expectedPageEnd)}`);
    };

    service.getEntriesStream(undefined, pageSize).subscribe(page1Result => {
      verifyPage(page1Result, {
        expectedDocCount: pageSize,
        expectedPageStart: page1Doc1,
        expectedPageEnd: page1Doc3
      });

      service.getEntriesStream(page1Result.loadMoreToken, pageSize).subscribe(page2Result => {
        verifyPage(page2Result, {
          expectedDocCount: pageSize,
          expectedPageStart: page2Doc1,
          expectedPageEnd: page2Doc3
        });

        service.getEntriesStream(page2Result.loadMoreToken, pageSize).subscribe(page3Result => {
          verifyPage(page3Result, {
            expectedDocCount: 2,
            expectedPageStart: page3Doc1,
            expectedPageEnd: page3Doc2
          });
        });
      });
    });

  })));

  it('stats$ - should emit once when not changed',
    fakeAsync(inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {

    mockData.loginAs(testUser);

    mockData.initFirestore(createTestUserData([
      genEntry(), genEntry(), genEntry()
    ]));

    const results: (LearnedEntriesStats | undefined)[] = [];

    service.stats$.subscribe(result => {
      expect(result).toBeDefined();

      if (result) {
        expect(result.totalEntryCount).toBe(3);
        expect(result.learnedEntryCount).toBe(0);
      }

      results.push(result);
    });

    mockData.emit();

    tick();

    mockData.emit();

    tick();

    expect(results.length).toBe(1);

  })));

  it('stats$ - unsubscribe should not affect other listeners',
    fakeAsync(inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {

    mockData.loginAs(testUser);

    mockData.initFirestore(createTestUserData([
      genEntry(), genEntry(), genEntry()
    ]));

    let entriesResult: EntriesResult | undefined;

    service.getEntriesStream().subscribe(result => {
      entriesResult = result;
    });

    mockData.emitAll();
    tick();

    // Make sure `getEntriesStream` returned a result
    expect(entriesResult).toBeDefined();

    const sub1Results: (LearnedEntriesStats | undefined)[] = [];
    const sub2Results: (LearnedEntriesStats | undefined)[] = [];

    const sub1 = service.stats$.subscribe(result => {
      sub1Results.push(result);
    });

    service.stats$.subscribe(result => {
      sub2Results.push(result);
    });

    tick();

    sub1.unsubscribe();

    if (entriesResult) {
      // Modify stats so that `stats$` emits a new value
      service.archive(entriesResult.entries[0].id);

      tick();
    }

    expect(sub1Results.length).toBe(1);
    expect(sub2Results.length).toBe(2);

  })));

  it('stats$ - archive/unarchive entry - should emit updated stats', (done: any) => {
    inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {
      mockData.loginAs(testUser);

      mockData.initFirestore(createTestUserData([
        genEntry()
      ]));

      let callbackCount = 0;

      service.stats$.subscribe(result => {
        callbackCount++;

        if (result) {

          // Initial
          if (callbackCount === 1) {
            expect(result.totalEntryCount).toBe(1);
            expect(result.learnedEntryCount).toBe(0);
          }

          // After archive
          if (callbackCount === 2) {
            expect(result.totalEntryCount).toBe(1);
            expect(result.learnedEntryCount).toBe(1);
          }

          // After unarchive
          if (callbackCount === 3) {
            expect(result.totalEntryCount).toBe(1);
            expect(result.learnedEntryCount).toBe(0);
            done();
          }
        }
      });

      service.getEntriesStream().subscribe(s => {
        if (!s.fromCache) {
          const entryId = s.entries[0].id;

          service.archive(entryId).then(() => {
            return service.unarchive(entryId);
          });
        }
      });

      mockData.emitAll();

    })();
  });

  it('stats$ - delete entry - should emit updated stats',
    async(inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {

      mockData.loginAs(testUser);

      mockData.initFirestore(createTestUserData([
        genEntry()
      ]));

      let callbackCount = 0;

      service.stats$.subscribe(result => {
        callbackCount++;

        if (result) {

          // Initial
          if (callbackCount === 1) {
            expect(result.totalEntryCount).toBe(1);
            expect(result.learnedEntryCount).toBe(0);
          }

          // After delete
          if (callbackCount === 2) {
            expect(result.totalEntryCount).toBe(0);
            expect(result.learnedEntryCount).toBe(0);
          }
        }
      });

      service.getEntriesStream().subscribe(s => {
        if (!s.fromCache) {
          const entryId = s.entries[0].id;

          service.delete(entryId);
        }
      });

      mockData.emitAll();

      expect(callbackCount).toBe(2);
    })));

  it('stats$ - add entry - should emit updated stats',
    async(inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {

      mockData.loginAs(testUser);

      const entryToAdd = genEntry();

      mockData.initFirestore(createTestUserData([
        genEntry()
      ]));

      let callbackCount = 0;

      service.stats$.subscribe(result => {
        callbackCount++;

        if (result) {

          // Initial
          if (callbackCount === 1) {
            expect(result.totalEntryCount).toBe(1);
            expect(result.learnedEntryCount).toBe(0);
          }

          // After add
          if (callbackCount === 2) {
            expect(result.totalEntryCount).toBe(2);
            expect(result.learnedEntryCount).toBe(0);
          }
        }
      });

      service.getEntriesStream().subscribe(s => {
        if (!s.fromCache) {
          service.addOrUpdate(entryToAdd);
        }
      });

      mockData.emitAll();

      expect(callbackCount).toBe(2);
    })));

  it('stats$ - archive entry before subscribing - should emit correct stats', (done: any) => {
    inject([MockData, EntryStorageService], (mockData: MockData, service: EntryStorageService) => {
      mockData.loginAs(testUser);

      mockData.initFirestore(createTestUserData([
        genEntry()
      ]));

      service.getEntriesStream().subscribe(s => {
        if (!s.fromCache) {
          service.archive(s.entries[0].id).then(() => {
            service.stats$.subscribe(result => {
              if (result) {
                expect(result.totalEntryCount).toBe(1);
                expect(result.learnedEntryCount).toBe(1);
                done();
              }
            });
          });
        }
      });

      mockData.emitAll();
    })();
  });
});

