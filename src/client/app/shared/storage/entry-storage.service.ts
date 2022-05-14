import { Inject, Injectable, NgZone } from '@angular/core';
import { Entry } from '../model';
import { Observable, Subscriber, from, ReplaySubject, BehaviorSubject, connectable, Connectable, map, filter, concatMap, takeWhile, tap, distinctUntilChanged, mergeWith } from 'rxjs';
import { AuthService } from '../auth';
import { firebaseAppToken } from 'ng-firebase-lite';
import { FirebaseApp } from 'firebase/app';
import { HttpClient } from '@angular/common/http';
import { addDoc, collection, deleteDoc, doc, enableIndexedDbPersistence, Firestore, getFirestore, limit, onSnapshot, orderBy, query, runTransaction, setDoc, startAt, connectFirestoreEmulator } from 'firebase/firestore';
import { environment } from 'environments/environment';


interface FirebaseEntry {
  originalText: string;
  translation?: string;
  addedOn?: number;
  updatedOn?: number;
}

interface RandomEntryResponse {
  batch: { id: string; data: FirebaseEntry; }[];
}

export interface EntriesResult {
  hasMore: boolean;
  entries: Entry[];
  loadMoreToken: any;
  fromCache: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;

type UserProperty = 'entries-count' | 'entries-archive-count';

type UserData = {
  [k in UserProperty]?: number
};

interface StatsServerData {
  fromCache: boolean;
  entriesCount: number | undefined;
  entriesArchiveCount: number | undefined;
}

export interface LearnedEntriesStats {
  totalEntryCount: number;
  learnedEntryCount: number;
}

@Injectable()
export class EntryStorageService {
  readonly stats$: Observable<LearnedEntriesStats | undefined>;

  private readonly db: Firestore;

  private persistenceEnabled$: Observable<boolean> | undefined;
  private latestStats$ = new BehaviorSubject<LearnedEntriesStats | undefined>(undefined);
  private clientCalculatedStats$ = new ReplaySubject<LearnedEntriesStats | undefined>();

  constructor(@Inject(firebaseAppToken) fba: FirebaseApp, private authService: AuthService, private http: HttpClient, private zone: NgZone) {
    this.db = getFirestore(fba);

    if (environment.useFirebaseEmulators) {
      connectFirestoreEmulator(this.db, 'localhost', 5002);
    }
    else {
      // Enable persistance only when not using emulator because emulated database is cleared automatically, but local cache is not, so there might be discrepancies.
      // See a note here: https://firebase.google.com/docs/emulator-suite/connect_firestore#android_apple_platforms_and_web_sdks
      enableIndexedDbPersistence(this.db).then(() => {
        console.log('Offline persistance successfully enabled.');
      }, err => {
        console.warn('Enabling offline persistance failed. Error ' + err);
      });
    }

    this.stats$ = this.createStatsStream();
  }

  getRandomEntryBatch(batchSize: number = 1): Observable<Entry[]> {
    return this.http.get<RandomEntryResponse>(`/api/random?batch_size=${batchSize}`)
      .pipe(
        map(response => response.batch.map(x => this.toEntry(x.id, x.data))
      ));
  }

  getEntriesStream(positionToken?: any, pageSize: number = DEFAULT_PAGE_SIZE): Observable<EntriesResult> {
    const resultStream = new ReplaySubject<EntriesResult>(1);

    let unsubscribeListener: () => void = () => {};

    let q = query(this.entryCollectionRef, 
      orderBy('addedOn', 'desc'), 
      ...(positionToken ? [startAt(positionToken)] : []), 
      limit(pageSize + 1));

    unsubscribeListener = onSnapshot(q, { includeMetadataChanges: true }, snapshot => {
      this.zone.run(() => {
        const hasMore = snapshot.docs.length > pageSize;

        const entries = snapshot.docs.slice(0, pageSize).map(d => {
          const data = d.data() as FirebaseEntry;
          const id = d.id;

          return this.toEntry(id, data);
        });

        const result: EntriesResult = {
          hasMore: hasMore,
          entries: entries,
          loadMoreToken: hasMore ? snapshot.docs[snapshot.docs.length - 1] : undefined,
          fromCache: snapshot.metadata.fromCache
        };
        resultStream.next(result);
      });
    }, error => {
      this.zone.run(() => resultStream.error(error));
    }, () => {
      this.zone.run(() => resultStream.complete());
    });

    return new Observable((observer: Subscriber<EntriesResult>) => {
      resultStream.subscribe(observer);

      return () => {
        unsubscribeListener();
      };
    });
  }

  getNewId() {
    return doc(this.entryCollectionRef).id;
  }

  async addOrUpdate(entry: Entry): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount + 1,
        learnedEntryCount: currentStats.learnedEntryCount
      };
    });

    const entryData: FirebaseEntry = {
      originalText: entry.originalText,
      translation: entry.translation,
      addedOn: entry.addedOn ? entry.addedOn.valueOf() : undefined,
      updatedOn: entry.updatedOn ? entry.updatedOn.valueOf() : undefined
    };

    if (entry.id) {
      await setDoc(doc(this.entryCollectionRef, entry.id), entryData);
    }
    else {
      const newEntryRef = await addDoc(this.entryCollectionRef, entryData);
      entry.id = newEntryRef.id;
    }
  }

  async delete(id: string): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount - 1,
        learnedEntryCount: currentStats.learnedEntryCount
      };
    });

    await deleteDoc(doc(this.entryCollectionRef, id));
  }

  async unarchive(id: string): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount,
        learnedEntryCount: currentStats.learnedEntryCount - 1
      };
    });

    const docRef = doc(this.entryCollectionRef, id);
    const archiveDocRef = doc(this.archiveCollectionRef, id);

    await runTransaction(this.db, async t => {
      const archiveDoc = await t.get(archiveDocRef);
      const archiveDocData = archiveDoc.data();

      if (archiveDocData) {
        t.set(docRef, archiveDocData);
        t.delete(archiveDocRef);
      }
    });
  }

  async archive(id: string): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount,
        learnedEntryCount: currentStats.learnedEntryCount + 1
      };
    });

    const docRef = doc(this.entryCollectionRef, id);
    const archiveDocRef = doc(this.archiveCollectionRef, id);

    await runTransaction(this.db, async t => {
      const doc = await t.get(docRef);
      const docData = doc.data();

      if (docData) {
        t.set(archiveDocRef, docData);
        t.delete(docRef);
      }
    });
  }

  private get entryCollectionRef() {
    return collection(this.userRef, 'entries');
  }

  private get archiveCollectionRef() {
    return collection(this.userRef, 'entries-archive');
  }

  private get userRef() {    
    return doc(collection(this.db, 'users'), this.authService.userId);
  }

  private toEntry(id: string, data: FirebaseEntry) {
    return new Entry({
      id: id,
      originalText: data.originalText,
      translation: data.translation,
      addedOn: data.addedOn ? new Date(data.addedOn) : undefined,
      updatedOn: data.updatedOn ? new Date(data.updatedOn) : undefined
    });
  }

  private updateStats(updateCallback: (currentStats: LearnedEntriesStats) => LearnedEntriesStats): void {
    const currentStats = this.latestStats$.getValue() || {
      totalEntryCount: 0,
      learnedEntryCount: 0
    };

    this.clientCalculatedStats$.next(updateCallback(currentStats));
  }

  private get serverStats$(): Observable<StatsServerData> {
    return Observable.create((subscriber: Subscriber<StatsServerData>) => {
      const snapshotUpdates$ = new ReplaySubject<StatsServerData>();

      const unsubscribeFromUserSnapshotChanges = onSnapshot(this.userRef, { includeMetadataChanges: true }, s => {
        this.zone.run(() => {
          const data: UserData | undefined = s.data();

          snapshotUpdates$.next({
            fromCache: s.metadata.fromCache,
            entriesCount: data ? data['entries-count'] : 0,
            entriesArchiveCount: data ? data['entries-archive-count'] : 0
          } as StatsServerData);
        });
      });

      const sub = snapshotUpdates$.subscribe(subscriber);

      return () => {
        unsubscribeFromUserSnapshotChanges();
        sub.unsubscribe();
      };
    });
  }

  private createStatsStream(): Observable<LearnedEntriesStats | undefined> {
    // The logic of the following stream is as follows:
    //   1. Wait until user is logged in
    //   2. Query the DB for the statistics until we get data not from cache (since we have local
    //      persistent cache enabled for offline support)
    //   3. Continuously watch the client-side updates to the statistics (updated when user adds/removes/archives records).
    const ret = connectable(
      this.authService.isLoggedIn.pipe(
        filter(isUserLoggedIn => !!isUserLoggedIn),
        concatMap(_ => this.serverStats$),
        // Take all values from cache until we get one NOT from cache (include it as well in the result).
        takeWhile((c) => c.fromCache, true),
        map((serverStats: StatsServerData) => {
          return {
            totalEntryCount: (serverStats.entriesCount || 0) + (serverStats.entriesArchiveCount || 0),
            learnedEntryCount: serverStats.entriesArchiveCount || 0
          } as LearnedEntriesStats;
        }),
        mergeWith(this.clientCalculatedStats$),
        distinctUntilChanged(this.compareStats),
        tap((v: LearnedEntriesStats | undefined) => this.latestStats$.next(v))
      ), { 
        connector: () => new ReplaySubject<LearnedEntriesStats | undefined>(1) 
      }
    ) as Connectable<LearnedEntriesStats | undefined>;

    ret.connect();

    return new Observable((subscriber: Subscriber<LearnedEntriesStats | undefined>) => {
      const sub = ret.subscribe(subscriber);

      return () => sub.unsubscribe();
    });
  }

  private compareStats(x: LearnedEntriesStats | undefined, y: LearnedEntriesStats | undefined): boolean {
    if (x === y) {
      return true;
    }

    if (!x || !y) {
      return false;
    }

    return x.totalEntryCount === y.totalEntryCount
      && x.learnedEntryCount === y.learnedEntryCount;
  }
}
