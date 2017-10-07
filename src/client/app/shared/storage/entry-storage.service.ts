import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Entry } from '../model';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { UserInfo } from 'firebase/app';

interface FirebaseEntry {
  $key?: string;
  originalText: string;
  translation?: string;
  addedOn?: number;
  updatedOn?: number;
}

@Injectable()
export class EntryStorageService {

  constructor(private dbService: AngularFireDatabase, private authService: AngularFireAuth) {

  }

  private get currentUser(): UserInfo {
    const result = this.authService.auth.currentUser;

    if (!result) {
      throw new Error('User is not logged in.');
    }

    return result;
  }

  getEntries(): Observable<Entry[]> {
    return this.dbService.list(`/users/${this.currentUser.uid}/entries`, {
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

    const entryKey = entry.id || this.dbService.database.ref('/users/' + this.currentUser.uid).child('entries').push().key;

    const updates: { [key: string]: any } = {};
    updates['/entries/' + entryKey] = entryData;

    this.dbService.database.ref('/users/' + this.currentUser.uid).update(updates);
  }

  delete(id: string): void {
    this.dbService.database.ref('/users/' + this.currentUser.uid + '/entries').child(id).remove();
  }
}
