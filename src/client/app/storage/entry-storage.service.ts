import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAt,
} from 'firebase/firestore';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  ReplaySubject,
  share,
  Subject,
  Subscriber,
  switchMap,
  take,
} from 'rxjs';

import { AuthService } from '../auth';
import { firestoreToken } from '../firebase';
import { Entry } from '../model';

interface FirebaseEntry {
  originalText: string;
  translation?: string;
  addedOn?: number;
  updatedOn?: number;
}

interface RandomEntryResponse {
  batch: { id: string; data: FirebaseEntry }[];
}

export interface EntriesResult {
  hasMore: boolean;
  entries: Entry[];
  loadMoreToken: unknown;
  fromCache: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;

type UserProperty = 'entries-count' | 'entries-archive-count';

type UserData = Partial<Record<UserProperty, number>>;

interface StatsServerData {
  fromCache: boolean;
  entriesCount: number | undefined;
  entriesArchiveCount: number | undefined;
}

export interface LearnedEntriesStats {
  totalEntryCount: number;
  learnedEntryCount: number;
}

@Injectable({ providedIn: 'root' })
export class EntryStorageService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly db = inject(firestoreToken);

  stats$!: Observable<LearnedEntriesStats>;

  private latestStats$ = new ReplaySubject<LearnedEntriesStats>(1);
  private clientCalculatedStats$ = new Subject<LearnedEntriesStats>();

  constructor() {
    this.stats$ = this.createStatsStream();
    this.stats$.subscribe(this.latestStats$);
  }

  getRandomEntryBatch(batchSize = 1): Observable<Entry[]> {
    return this.http
      .get<RandomEntryResponse>(`/api/random?batch_size=${batchSize}`)
      .pipe(map(response => response.batch.map(x => this.toEntry(x.id, x.data))));
  }

  getEntriesStream(positionToken?: unknown, pageSize: number = DEFAULT_PAGE_SIZE): Observable<EntriesResult> {
    const resultStream = new ReplaySubject<EntriesResult>(1);

    let unsubscribeListener: () => void = () => {};

    const q = query(
      this.entryCollectionRef,
      orderBy('addedOn', 'desc'),
      ...(positionToken ? [startAt(positionToken)] : []),
      limit(pageSize + 1),
    );

    unsubscribeListener = onSnapshot(
      q,
      { includeMetadataChanges: true },
      snapshot => {
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
            fromCache: snapshot.metadata.fromCache,
          };
          resultStream.next(result);
        });
      },
      error => {
        this.zone.run(() => resultStream.error(error));
      },
      () => {
        this.zone.run(() => resultStream.complete());
      },
    );

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
        learnedEntryCount: currentStats.learnedEntryCount,
      };
    });

    const entryData: FirebaseEntry = {
      originalText: entry.originalText,
      translation: entry.translation,
      addedOn: entry.addedOn ? entry.addedOn.valueOf() : undefined,
      updatedOn: entry.updatedOn ? entry.updatedOn.valueOf() : undefined,
    };

    if (entry.id) {
      await setDoc(doc(this.entryCollectionRef, entry.id), entryData);
    } else {
      const newEntryRef = await addDoc(this.entryCollectionRef, entryData);
      entry.id = newEntryRef.id;
    }
  }

  async delete(id: string): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount - 1,
        learnedEntryCount: currentStats.learnedEntryCount,
      };
    });

    await deleteDoc(doc(this.entryCollectionRef, id));
  }

  async unarchive(id: string): Promise<void> {
    this.updateStats(currentStats => {
      return {
        totalEntryCount: currentStats.totalEntryCount,
        learnedEntryCount: currentStats.learnedEntryCount - 1,
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
        learnedEntryCount: currentStats.learnedEntryCount + 1,
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
      updatedOn: data.updatedOn ? new Date(data.updatedOn) : undefined,
    });
  }

  private updateStats(calculateClientStats: (currentStats: LearnedEntriesStats) => LearnedEntriesStats): void {
    this.latestStats$.pipe(take(1)).subscribe(currentStats => {
      const clientStats = calculateClientStats(currentStats);
      this.clientCalculatedStats$.next(clientStats);
    });
  }

  private get serverStats$(): Observable<StatsServerData> {
    return new Observable((subscriber: Subscriber<StatsServerData>) => {
      const snapshotUpdates$ = new ReplaySubject<StatsServerData>();

      const unsubscribeFromUserSnapshotChanges = onSnapshot(this.userRef, { includeMetadataChanges: true }, s => {
        this.zone.run(() => {
          const data: UserData | undefined = s.data();

          const statsData = {
            fromCache: s.metadata.fromCache,
            entriesCount: data ? data['entries-count'] : 0,
            entriesArchiveCount: data ? data['entries-archive-count'] : 0,
          } as StatsServerData;

          snapshotUpdates$.next(statsData);
        });
      });

      const sub = snapshotUpdates$
        .pipe(
          // Throttle updates because when an entry is archived, updates
          // to both properties happen one after another
          debounceTime(100),
        )
        .subscribe(subscriber);

      return () => {
        unsubscribeFromUserSnapshotChanges();
        sub.unsubscribe();
      };
    });
  }

  private createStatsStream(): Observable<LearnedEntriesStats> {
    return this.authService.authStateChanged.pipe(
      filter(user => !!user),
      switchMap(() => this.serverStats$),
      map((serverStats: StatsServerData) => {
        return {
          totalEntryCount: (serverStats.entriesCount || 0) + (serverStats.entriesArchiveCount || 0),
          learnedEntryCount: serverStats.entriesArchiveCount || 0,
        } as LearnedEntriesStats;
      }),
      // Because stats are calculated on the server in a cloud function, it may take time before
      // they are pushed to the client, so in the meantime we also calculate the stats on the client,
      // so that user sees the updates immediately
      // mergeWith(this.clientCalculatedStats$),
      distinctUntilChanged(this.compareStats),
      // Cache latest result and replay it for each new subscriber
      share({ connector: () => new ReplaySubject<LearnedEntriesStats>(1) }),
    );
  }

  private compareStats(x: LearnedEntriesStats, y: LearnedEntriesStats): boolean {
    if (x === y) {
      return true;
    }

    if (!x || !y) {
      return false;
    }

    return x.totalEntryCount === y.totalEntryCount && x.learnedEntryCount === y.learnedEntryCount;
  }
}
