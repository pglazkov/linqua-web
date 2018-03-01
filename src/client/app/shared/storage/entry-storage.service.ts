import { Injectable } from '@angular/core';
import { Entry } from '../model';
import { Observable } from 'rxjs/observable';

import { AuthService } from '../auth';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { from } from 'rxjs/observable/from';
import { map } from 'rxjs/operators/map';
import { FirebaseApp } from '../firebase';
import { firestore } from 'firebase/app';
import { HttpClient } from '@angular/common/http';


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

export const pageSize = 20;

@Injectable()
export class EntryStorageService {

  readonly db: firestore.Firestore;

  private persistenceEnabled$: Observable<boolean>;

  constructor(private fba: FirebaseApp, private authService: AuthService, private http: HttpClient) {
    this.db = fba.firestore();
    this.persistenceEnabled$ = from(this.db.enablePersistence().then(() => true, () => false));
  }

  getRandomEntryBatch(batchSize: number = 1): Observable<Entry[]> {
    return this.http.get<RandomEntryResponse>(`/api/random?batch_size=${batchSize}`)
      .pipe(
        map(response => response.batch.map(x => this.toEntry(x.id, x.data))
      ));
  }

  getEntriesStream(positionToken?: any): Observable<EntriesResult> {
    const resultStream = new Subject<EntriesResult>();

    let query = this.entryCollectionRef.orderBy('addedOn', 'desc');

    if (positionToken) {
      query = query.startAt(positionToken);
    }

    query = query.limit(pageSize + 1);

    let unsubscribeListener: () => void = () => {};

    unsubscribeListener = query.onSnapshot({ includeQueryMetadataChanges: true }, snapshot => {
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
    }, error => {
      resultStream.error(error);
    }, () => {
      resultStream.complete();
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

  delete(id: string): Promise<void> {
    return this.entryCollectionRef.doc(id).delete();
  }

  private get entryCollectionRef() {
    return this.db
      .collection('users')
      .doc(this.authService.userId)
      .collection('entries');
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
}
