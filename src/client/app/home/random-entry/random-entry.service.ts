import { Injectable } from '@angular/core';
import { Entry, EntryConfig, EntryStorageService } from 'shared';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

const PERSISTENT_CACHE_KEY = 'nextRandomEntry';

@Injectable()
export class RandomEntryService {

  private nextEntrySubject: ReplaySubject<Entry> | undefined;

  constructor(private storage: EntryStorageService) {
    this.nextEntrySubject = this.tryLoadFromPersistentCache();
  }

  getRandomEntry(): Observable<Entry> {
    let result: Observable<Entry>;

    if (this.nextEntrySubject) {
      result = this.nextEntrySubject;
    }
    else {
      result = this.storage.getRandomEntry();
    }

    this.preloadNextEntry();

    return result;
  }

  private get persistentCacheStorage(): Storage {
    return window.sessionStorage;
  }

  private preloadNextEntry() {
    this.nextEntrySubject = new ReplaySubject<Entry>();
    this.storage.getRandomEntry().subscribe(this.nextEntrySubject);

    this.saveInPersistentCache(this.nextEntrySubject);
  }

  private saveInPersistentCache(nextEntry$: Observable<Entry>) {
    nextEntry$.subscribe(entry => {
      this.persistentCacheStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(entry));
    });
  }

  private tryLoadFromPersistentCache() : ReplaySubject<Entry> | undefined {
    const cached = this.persistentCacheStorage.getItem(PERSISTENT_CACHE_KEY);

    if (!cached) {
      return undefined;
    }

    const nextEntrySubject = new ReplaySubject<Entry>();
    nextEntrySubject.next(new Entry(JSON.parse(cached) as EntryConfig));
    nextEntrySubject.complete();

    return nextEntrySubject;
  }
}
