import { Injectable, NgZone } from '@angular/core';
import { Entry } from '../model';
import { Observable } from 'rxjs/Observable';

import { AuthService } from '../auth';
import { Subscriber } from 'rxjs/Subscriber';
import { from } from 'rxjs/observable/from';
import { map, merge, filter, multicast, concatMap, takeWhile, take, concat, tap, distinctUntilChanged } from 'rxjs/operators';
import { FirebaseApp } from 'ng-firebase-lite';
import { firestore } from 'firebase/app';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ConnectableObservable } from 'rxjs/Rx';


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

  private readonly db: firestore.Firestore;

  private persistenceEnabled$: Observable<boolean>;
  private latestStats$ = new BehaviorSubject<LearnedEntriesStats | undefined>(undefined);
  private clientCalculatedStats$ = new ReplaySubject<LearnedEntriesStats | undefined>();

  constructor(private fba: FirebaseApp, private authService: AuthService, private http: HttpClient, private zone: NgZone) {
    this.db = fba.firestore();
    this.persistenceEnabled$ = from(this.db.enablePersistence().then(() => true, () => false));

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

    let query = this.entryCollectionRef.orderBy('addedOn', 'desc');

    if (positionToken) {
      query = query.startAt(positionToken);
    }

    query = query.limit(pageSize + 1);

    let unsubscribeListener: () => void = () => {};

    unsubscribeListener = query.onSnapshot({ includeQueryMetadataChanges: true }, snapshot => {
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

    return Observable.create((observer: Subscriber<EntriesResult>) => {
      resultStream.subscribe(observer);

      return () => {
        unsubscribeListener();
      };
    });
  }

  getNewId() {
    return this.entryCollectionRef.doc().id;
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
      await this.entryCollectionRef.doc(entry.id).set(entryData);
    }
    else {
      const newEntryRef = await this.entryCollectionRef.add(entryData);
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

    await this.entryCollectionRef.doc(id).delete();
  }

  async unarchive(id: string): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount,
        learnedEntryCount: currentStats.learnedEntryCount - 1
      };
    });

    const docRef = this.entryCollectionRef.doc(id);
    const archiveDocRef = this.archiveCollectionRef.doc(id);

    await this.db.runTransaction(async t => {
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

    const docRef = this.entryCollectionRef.doc(id);
    const archiveDocRef = this.archiveCollectionRef.doc(id);

    await this.db.runTransaction(async t => {
      const doc = await t.get(docRef);
      const docData = doc.data();

      if (docData) {
        t.set(archiveDocRef, docData);
        t.delete(docRef);
      }
    });
  }

  private get entryCollectionRef() {
    return this.userRef.collection('entries');
  }

  private get archiveCollectionRef() {
    return this.userRef.collection('entries-archive');
  }

  private get userRef() {
    return this.db
      .collection('users')
      .doc(this.authService.userId);
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

      const unsubscribeFromUserSnapshotChanges = this.userRef.onSnapshot({ includeMetadataChanges: true }, s => {
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
    const ret = this.authService.isLoggedIn.pipe(
      filter(isUserLoggedIn => isUserLoggedIn),
      concatMap(_ => this.serverStats$),
      // Take all values from cache until we get one NOT from cache (include it as well in the result).
      // The following trick with multicast operator is to achieve a "takeUntilInclusive" behavior. It was taken from here:
      // https://github.com/ReactiveX/rxjs/issues/2420#issuecomment-355417505
      multicast(
        () => new ReplaySubject(1),
        (serverStats) => serverStats.pipe(
          takeWhile((c) => c.fromCache),
          concat(serverStats.pipe(
            take(1),
          ))
        )
      ),
      map(serverStats => {
        return {
          totalEntryCount: (serverStats.entriesCount || 0) + (serverStats.entriesArchiveCount || 0),
          learnedEntryCount: serverStats.entriesArchiveCount || 0
        } as LearnedEntriesStats;
      }),
      merge(this.clientCalculatedStats$),
      distinctUntilChanged(this.compareStats),
      tap(v => this.latestStats$.next(v)),
      multicast(() => new ReplaySubject<LearnedEntriesStats | undefined>(1))
    ) as ConnectableObservable<LearnedEntriesStats | undefined>;

    ret.connect();

    return Observable.create((subscriber: Subscriber<LearnedEntriesStats | undefined>) => {
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
