import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable, ReplaySubject } from 'rxjs';

import { AuthService } from '../../auth';
import { Entry } from '../../model';
import { EntryStorageService } from '../../storage';

const PERSISTENT_CACHE_KEY_PREFIX = 'random-entry-batch-';
const BATCH_SIZE = 10;

type EntryCacheDto = {
  // Change the Date properties to `number`
  [Property in keyof Entry]: Entry[Property] extends Date ? number : Entry[Property];
};

interface CacheValue {
  entries: readonly EntryCacheDto[];
}

@Injectable({ providedIn: 'root' })
export class RandomEntryService {
  private readonly storage = inject(EntryStorageService);
  private readonly authService = inject(AuthService);

  private batch$ = this.getBatch();

  async getRandomEntry(): Promise<Entry | undefined> {
    const batch = await firstValueFrom(this.batch$);

    const updatedBatch = [...batch];

    const nextEntry = updatedBatch.pop();

    this.saveInPersistentCache(updatedBatch);
    this.batch$ = this.getBatch();

    return nextEntry;
  }

  async onEntryUpdated(entry: Entry): Promise<void> {
    const batch = await firstValueFrom(this.batch$);

    if (batch && batch.length > 0) {
      const entryInBatch = batch.find(x => x.id === entry.id);

      if (entryInBatch) {
        const idx = batch.indexOf(entryInBatch);

        const updatedBatch = [...batch];
        updatedBatch[idx] = entry;

        this.saveInPersistentCache(updatedBatch);
        this.batch$ = this.getBatch();
      }
    }
  }

  async onEntryDeleted(entry: Entry): Promise<void> {
    const batch = await firstValueFrom(this.batch$);

    if (batch && batch.length > 0) {
      const entryInBatch = batch.find(x => x.id === entry.id);

      if (entryInBatch) {
        const updatedBatch = [...batch];
        updatedBatch.splice(updatedBatch.indexOf(entryInBatch), 1);

        this.saveInPersistentCache(updatedBatch);
        this.batch$ = this.getBatch();
      }
    }

    return Promise.resolve();
  }

  private get persistentCacheKey() {
    return PERSISTENT_CACHE_KEY_PREFIX + this.authService.userId;
  }

  private getBatch(): Observable<readonly Entry[]> {
    let result: Observable<readonly Entry[]>;

    const cached = this.loadFromPersistentCache();

    if (cached && cached.length > 0) {
      const batchSubject = new ReplaySubject<readonly Entry[]>(1);
      batchSubject.next(cached);
      batchSubject.complete();

      result = batchSubject;
    } else {
      result = this.loadNextBatchAndSaveInPersistentCache();
    }

    return result;
  }

  private loadFromPersistentCache(): readonly Entry[] | undefined {
    const rawStorageValue = this.persistentCacheStorage.getItem(this.persistentCacheKey);

    if (!rawStorageValue) {
      return undefined;
    }

    const cacheEntry: CacheValue = JSON.parse(rawStorageValue);

    return cacheEntry.entries.map(this.fromCacheDto);
  }

  private saveInPersistentCache(entries: readonly Entry[] | undefined) {
    if (entries) {
      const cacheEntry: CacheValue = { entries: entries.map(this.toCacheDto) };

      this.persistentCacheStorage.setItem(this.persistentCacheKey, JSON.stringify(cacheEntry));
    } else {
      this.persistentCacheStorage.removeItem(this.persistentCacheKey);
    }
  }

  private get persistentCacheStorage(): Storage {
    return window.localStorage;
  }

  private loadNextBatchAndSaveInPersistentCache(): Observable<readonly Entry[]> {
    const resultSubject = new ReplaySubject<readonly Entry[]>(1);

    this.loadBatchFromStorage().subscribe(resultSubject);

    resultSubject.subscribe(batch => {
      this.saveInPersistentCache(batch);
    });

    return resultSubject;
  }

  private loadBatchFromStorage(): Observable<readonly Entry[]> {
    return this.storage.getRandomEntryBatch(BATCH_SIZE);
  }

  private toCacheDto(entry: Entry): EntryCacheDto {
    return {
      id: entry.id,
      originalText: entry.originalText,
      translation: entry.translation,
      addedOn: entry.addedOn.valueOf(),
      updatedOn: entry.updatedOn.valueOf(),
    };
  }

  private fromCacheDto(entryDto: EntryCacheDto): Entry {
    return {
      id: entryDto.id,
      originalText: entryDto.originalText,
      translation: entryDto.translation,
      addedOn: new Date(entryDto.addedOn),
      updatedOn: new Date(entryDto.updatedOn),
    };
  }
}
