import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firebaseConfig } from '@linqua/firebase-config';
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';
import uniqueId from 'lodash-es/uniqueId';
import { filter, take } from 'rxjs';

import { AuthService } from '../auth';
import { firebaseAuthToken, firestoreToken } from '../firebase';
import { Entry } from '../model';
import { EntriesResult, EntryStorageService } from './entry-storage.service';

const firebaseApp = initializeApp(firebaseConfig);

initializeFirestore(firebaseApp, {
  localCache: memoryLocalCache(),
});

const auth = getAuth(firebaseApp);
connectAuthEmulator(auth, 'http://localhost:9099');

const db = getFirestore(firebaseApp);
connectFirestoreEmulator(db, 'localhost', 5002);

const currentDate = new Date(2018, 4, 1, 12, 0, 0, 0);

async function createTestUserData(uid: string, entries: Entry[]): Promise<Entry[]> {
  const entryCollectionRef = collection(doc(collection(db, 'users'), uid), 'entries');

  for (const entry of entries) {
    const entryData = {
      addedOn: entry.addedOn.getTime(),
      updatedOn: entry.addedOn.getTime(),
      originalText: entry.originalText,
      translation: entry.translation,
    };

    const newEntryRef = await addDoc(entryCollectionRef, entryData);
    entry.id = newEntryRef.id;
  }

  return entries;
}

function genEntry(addedOnMinutesOffset?: number): Entry {
  const addedOn = new Date(currentDate);

  if (addedOnMinutesOffset) {
    addedOn.setMinutes(addedOn.getMinutes() + addedOnMinutesOffset);
  }

  return new Entry({
    addedOn: addedOn,
    updatedOn: addedOn,
    originalText: 'test',
    translation: 'test',
  });
}

async function generateUserAndLogin(): Promise<UserCredential> {
  const userEmail = `${uniqueId('unit-test')}-${new Date().valueOf()}@linqua-app.com`;
  const userPassword = 'unit-test-pass';

  let user: UserCredential;

  try {
    user = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    switch (error.message) {
      case 'auth/email-already-in-use':
        // Test user already exists, skipping creation.
        break;
      default:
        throw error;
    }
  }

  user = await signInWithEmailAndPassword(auth, userEmail, userPassword);

  return user;
}

describe('EntryStorageService', () => {
  let service!: EntryStorageService;
  let cred!: UserCredential;

  beforeEach(async () => {
    cred = await generateUserAndLogin();

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        AuthService,
        EntryStorageService,
        { provide: firebaseAuthToken, useValue: auth },
        { provide: firestoreToken, useValue: db },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EntryStorageService);
  });

  it('getEntriesStream - should emit twice - fromCache=true,false', (done: DoneFn) => {
    createTestUserData(cred.user.uid, [genEntry()]).then(() => {
      const results: EntriesResult[] = [];

      service
        .getEntriesStream()
        .pipe(take(2))
        .subscribe({
          next: entries => {
            results.push(entries);

            if (results.length === 2) {
              expect(results[0].fromCache).toBe(true);
              expect(results[1].fromCache).toBe(false);
            }
          },
          error: done.fail,
          complete: () => done(),
        });
    }, done.fail);
  });

  it('getEntriesStream - paging', (done: DoneFn) => {
    const pageSize = 3;

    const verifyPage = (
      result: EntriesResult,
      spec: {
        expectedPageStart: Entry;
        expectedPageEnd: Entry;
        expectedDocCount: number;
      },
    ) => {
      expect(result.entries.length).toBe(spec.expectedDocCount);

      const firstEntryId = result.entries[0].id;
      const lastEntryId = result.entries[result.entries.length - 1].id;

      expect(firstEntryId).toBe(
        spec.expectedPageStart.id,
        `Expected page to start with ${JSON.stringify(spec.expectedPageStart)}`,
      );

      expect(lastEntryId).toBe(
        spec.expectedPageEnd.id,
        `Expected page to end with ${JSON.stringify(spec.expectedPageEnd)}`,
      );
    };

    const page1Doc1 = genEntry();
    const page1Doc2 = genEntry(-2);
    const page1Doc3 = genEntry(-3);

    const page2Doc1 = genEntry(-4);
    const page2Doc2 = genEntry(-5);
    const page2Doc3 = genEntry(-6);

    const page3Doc1 = genEntry(-7);
    const page3Doc2 = genEntry(-8);

    createTestUserData(cred.user.uid, [
      // Page 1
      page1Doc1,
      page1Doc2,
      page1Doc3,

      // Page 2
      page2Doc1,
      page2Doc2,
      page2Doc3,

      // Page 3
      page3Doc1,
      page3Doc2,
    ]).then(() => {
      service
        .getEntriesStream(undefined, pageSize)
        .pipe(
          filter(x => !x.fromCache),
          take(1),
        )
        .subscribe({
          next: page1Result => {
            verifyPage(page1Result, {
              expectedDocCount: pageSize,
              expectedPageStart: page1Doc1,
              expectedPageEnd: page1Doc3,
            });

            service
              .getEntriesStream(page1Result.loadMoreToken, pageSize)
              .pipe(
                filter(x => !x.fromCache),
                take(1),
              )
              .subscribe({
                next: page2Result => {
                  verifyPage(page2Result, {
                    expectedDocCount: pageSize,
                    expectedPageStart: page2Doc1,
                    expectedPageEnd: page2Doc3,
                  });

                  service
                    .getEntriesStream(page2Result.loadMoreToken, pageSize)
                    .pipe(
                      filter(x => !x.fromCache),
                      take(1),
                    )
                    .subscribe({
                      next: page3Result => {
                        verifyPage(page3Result, {
                          expectedDocCount: 2,
                          expectedPageStart: page3Doc1,
                          expectedPageEnd: page3Doc2,
                        });
                      },
                      error: done.fail,
                      complete: () => done(),
                    });
                },
                error: done.fail,
              });
          },
          error: done.fail,
        });
    }, done.fail);
  });

  it('stats$ - should emit correct counts', (done: DoneFn) => {
    service.stats$
      .pipe(
        filter(x => x.totalEntryCount === 3),
        take(1),
      )
      .subscribe({
        next: result => {
          expect(result).toBeDefined();

          if (result) {
            expect(result.totalEntryCount).toBe(3);
            expect(result.learnedEntryCount).toBe(0);
          }
        },
        error: done.fail,
        complete: done,
      });

    createTestUserData(cred.user.uid, [genEntry(), genEntry(), genEntry()]).catch(done.fail);
  });

  it('stats$ - archive/unarchive entry - should emit updated stats', (done: DoneFn) => {
    const entry = genEntry();
    let callbackCount = 0;

    service.stats$.pipe(take(4)).subscribe({
      next: result => {
        callbackCount++;

        // No data
        if (callbackCount === 1) {
          expect(result.totalEntryCount).toBe(0);
          expect(result.learnedEntryCount).toBe(0);

          service.addOrUpdate(entry);
        } else if (callbackCount === 2) {
          // After initial entry was added
          expect(result.totalEntryCount).toBe(1);
          expect(result.learnedEntryCount).toBe(0);

          // Now archive/unarchive the entry
          service.archive(entry.id);
        } else if (callbackCount === 3) {
          // After archive
          expect(result.totalEntryCount).toBe(1);
          expect(result.learnedEntryCount).toBe(1);

          service.unarchive(entry.id);
        } else if (callbackCount === 4) {
          // After unqrchive
          expect(result.totalEntryCount).toBe(1);
          expect(result.learnedEntryCount).toBe(0);
        }
      },
      error: done.fail,
      complete: done,
    });
  });

  it('stats$ - delete entry - should emit updated stats', (done: DoneFn) => {
    const entry = genEntry();
    let callbackCount = 0;

    service.stats$.pipe(take(3)).subscribe({
      next: result => {
        callbackCount++;

        // No data
        if (callbackCount === 1) {
          expect(result.totalEntryCount).toBe(0);
          expect(result.learnedEntryCount).toBe(0);

          service.addOrUpdate(entry);
        } else if (callbackCount === 2) {
          // After initial entry was added
          expect(result.totalEntryCount).toBe(1);
          expect(result.learnedEntryCount).toBe(0);

          // Now delete the entry
          service.delete(entry.id);
        } else if (callbackCount === 3) {
          // After delete
          expect(result.totalEntryCount).toBe(0);
          expect(result.learnedEntryCount).toBe(0);
        }
      },
      error: done.fail,
      complete: done,
    });
  });

  it('stats$ - add entry - should emit updated stats', (done: DoneFn) => {
    let callbackCount = 0;

    service.stats$.pipe(take(2)).subscribe({
      next: result => {
        callbackCount++;

        // No data
        if (callbackCount === 1) {
          expect(result.totalEntryCount).toBe(0);
          expect(result.learnedEntryCount).toBe(0);

          service.addOrUpdate(genEntry());
        } else if (callbackCount === 2) {
          // After entry was added
          expect(result.totalEntryCount).toBe(1);
          expect(result.learnedEntryCount).toBe(0);
        }
      },
      error: done.fail,
      complete: done,
    });
  });
});
