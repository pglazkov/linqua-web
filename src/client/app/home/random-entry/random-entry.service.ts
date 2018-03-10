import { Injectable } from '@angular/core';
import { Entry, EntryConfig, EntryStorageService, AuthService } from 'shared';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

const PERSISTENT_CACHE_KEY_PREFIX = 'random-entry-batch-';
const BATCH_SIZE = 10;

interface CacheEntry {
  entries: EntryConfig[];
}

@Injectable()
export class RandomEntryService {

  private batch$: Observable<Entry[]>;

  constructor(private storage: EntryStorageService, private authService: AuthService) {
    this.batch$ = this.loadBatch();
  }

  getRandomEntry(): Observable<Entry | undefined> {
    const result = new ReplaySubject<Entry | undefined>();

    this.batch$.subscribe(batch => {
      const nextEntry = batch.pop();
      this.saveInPersistentCache(batch);

      result.next(nextEntry);
      result.complete();

      if (batch.length === 0) {
        this.batch$ = this.loadBatch();
      }
    });

    return result;
  }

  async onEntryUpdated(entry: Entry): Promise<void> {
    const batch = await this.batch$.toPromise();

    if (batch && batch.length > 0) {
      const entryInBatch = batch.find(x => x.id === entry.id);

      if (entryInBatch) {
        const idx = batch.indexOf(entryInBatch);

        batch[idx] = entry;
      }
    }
  }

  async onEntryDeleted(entry: Entry): Promise<void> {
    const batch = await this.batch$.toPromise();

    if (batch && batch.length > 0) {
      const entryInBatch = batch.find(x => x.id === entry.id);

      if (entryInBatch) {
        batch.splice(batch.indexOf(entryInBatch), 1);

        if (batch.length === 0) {
          // We deleted last entry from the loaded batch, so
          // we also need to make sure that persistent cache is also empty before
          // trying to load the next batch.
          this.saveInPersistentCache([]);

          this.batch$ = this.loadBatch();
        }
      }
    }

    return Promise.resolve();
  }

  private get persistentCacheKey() {
    return PERSISTENT_CACHE_KEY_PREFIX + this.authService.userId;
  }

  private loadBatch(): Observable<Entry[]> {
    let result: Observable<Entry[]>;

    const cached = this.loadFromPersistentCache();

    if (cached && cached.length > 0) {
      const batchSubject = new ReplaySubject<Entry[]>();
      batchSubject.next(cached);
      batchSubject.complete();

      result = batchSubject;
    }
    else {
      result = this.preloadNextBatch();
    }

    return result;
  }

  private loadFromPersistentCache(): Entry[] | undefined {
    const rawStorageValue = this.persistentCacheStorage.getItem(this.persistentCacheKey);

    if (!rawStorageValue) {
      return undefined;
    }

    const cacheEntry: CacheEntry = JSON.parse(rawStorageValue);

    return cacheEntry.entries.map(x => new Entry(x));
  }

  private saveInPersistentCache(entries: Entry[] | undefined) {
    if (entries) {
      const cacheEntry: CacheEntry = { entries: entries };

      this.persistentCacheStorage.setItem(this.persistentCacheKey, JSON.stringify(cacheEntry));
    }
    else {
      this.persistentCacheStorage.removeItem(this.persistentCacheKey);
    }
  }

  private get persistentCacheStorage(): Storage {
    return window.sessionStorage;
  }

  private preloadNextBatch(): Observable<Entry[]> {
    const resultSubject = new ReplaySubject<Entry[]>();

    this.storage.getRandomEntryBatch(BATCH_SIZE).subscribe(resultSubject);

    resultSubject.subscribe(batch => {
      this.saveInPersistentCache(batch);
    });

    return resultSubject;
  }
}
