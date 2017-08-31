import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Entry } from '../model';
import { Observable } from 'rxjs/Observable';

interface FirebaseEntry {
  $key?: string;
  originalText: string;
  translation?: string;
  addedOn?: number;
  updatedOn?: number;
}

@Injectable()
export class EntryStorageService {

  constructor(private db: AngularFireDatabase) {

  }

  getEntries(): Observable<Entry[]> {
    return this.db.list('/entries', {
      query: {
        limitToLast: 50,
        orderByChild: 'addedOn'
      }
    }).first().map((entries: FirebaseEntry[]) => {
      return entries.map(x => {
        return new Entry({
          id: x.$key,
          originalText: x.originalText,
          translation: x.translation,
          addedOn: x.addedOn ? new Date(x.addedOn) : undefined,
          updatedOn: x.updatedOn ? new Date(x.updatedOn) : undefined
        });
      });
    });
  }

  addOrUpdate(entry: Entry): void {
    const entryData: FirebaseEntry = {
      originalText: entry.originalText,
      translation: entry.translation,
      addedOn: entry.addedOn ? entry.addedOn.valueOf() : undefined,
      updatedOn: entry.updatedOn ? entry.updatedOn.valueOf() : undefined
    };

    const entryKey = entry.id || this.db.database.ref().child('entries').push().key;

    const updates: { [key: string]: any } = {};
    updates['/entries/' + entryKey] = entryData;

    this.db.database.ref().update(updates);
  }

  delete(id: string): void {
    this.db.list('/entries').remove(id);
  }
}
