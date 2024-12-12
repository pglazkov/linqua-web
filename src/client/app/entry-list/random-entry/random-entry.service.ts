import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable, ReplaySubject } from 'rxjs';

import { AuthService } from '../../auth';
import { Entry } from '../../model';
import { EntryStorageService } from '../../storage';

const PERSISTENT_CACHE_KEY_PREFIX = 'random-entry-batch-';
const BATCH_SIZE = 10;

interface CacheEntry {
  entries: Entry[];
}

@Injectable({ providedIn: 'root' })
export class RandomEntryService {
  private readonly storage = inject(EntryStorageService);
  private readonly authService = inject(AuthService);

  private batch$ = this.getBatch();

  async getRandomEntry(): Promise<Entry | undefined> {
    const batch = await firstValueFrom(this.batch$);

    const nextEntry = batch.pop();
    this.saveInPersistentCache(batch);

    if (batch.length === 0) {
      this.batch$ = this.getBatch();
    }

    return nextEntry;
  }

  async onEntryUpdated(entry: Entry): Promise<void> {
    const batch = await firstValueFrom(this.batch$);

    if (batch && batch.length > 0) {
      const entryInBatch = batch.find(x => x.id === entry.id);

      if (entryInBatch) {
        const idx = batch.indexOf(entryInBatch);

        batch[idx] = entry;
      }
    }
  }

  async onEntryDeleted(entry: Entry): Promise<void> {
    const batch = await firstValueFrom(this.batch$);

    if (batch && batch.length > 0) {
      const entryInBatch = batch.find(x => x.id === entry.id);

      if (entryInBatch) {
        batch.splice(batch.indexOf(entryInBatch), 1);

        if (batch.length === 0) {
          // We deleted last entry from the loaded batch, so
          // we also need to make sure that persistent cache is also empty before
          // trying to load the next batch.
          this.saveInPersistentCache([]);

          this.batch$ = this.getBatch();
        }
      }
    }

    return Promise.resolve();
  }

  private get persistentCacheKey() {
    return PERSISTENT_CACHE_KEY_PREFIX + this.authService.userId;
  }

  private getBatch(): Observable<Entry[]> {
    let result: Observable<Entry[]>;

    const cached = this.loadFromPersistentCache();

    if (cached && cached.length > 0) {
      const batchSubject = new ReplaySubject<Entry[]>(1);
      batchSubject.next(cached);
      batchSubject.complete();

      result = batchSubject;
    } else {
      result = this.loadNextBatchAndSaveInPersistentCache();
    }

    return result;
  }

  private loadFromPersistentCache(): Entry[] | undefined {
    const rawStorageValue = this.persistentCacheStorage.getItem(this.persistentCacheKey);

    if (!rawStorageValue) {
      return undefined;
    }

    const cacheEntry: CacheEntry = JSON.parse(rawStorageValue);

    return cacheEntry.entries;
  }

  private saveInPersistentCache(entries: Entry[] | undefined) {
    if (entries) {
      const cacheEntry: CacheEntry = { entries: entries };

      this.persistentCacheStorage.setItem(this.persistentCacheKey, JSON.stringify(cacheEntry));
    } else {
      this.persistentCacheStorage.removeItem(this.persistentCacheKey);
    }
  }

  private get persistentCacheStorage(): Storage {
    return window.localStorage;
  }

  private loadNextBatchAndSaveInPersistentCache(): Observable<Entry[]> {
    const resultSubject = new ReplaySubject<Entry[]>(1);

    this.loadBatchFromStorage().subscribe(resultSubject);

    resultSubject.subscribe(batch => {
      this.saveInPersistentCache(batch);
    });

    return resultSubject;
  }

  private loadBatchFromStorage(): Observable<Entry[]> {
    return this.storage.getRandomEntryBatch(BATCH_SIZE);
  }
}
