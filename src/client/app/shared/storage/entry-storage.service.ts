import { Injectable } from '@angular/core';
import { Entry } from '../model';
import { Observable } from 'rxjs/observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { UserInfo } from 'firebase/app';
import { AngularFirestore } from 'angularfire2/firestore';

interface FirebaseEntry {
  originalText: string;
  translation?: string;
  addedOn?: number;
  updatedOn?: number;
}

@Injectable()
export class EntryStorageService {

  constructor(private db: AngularFirestore, private authService: AngularFireAuth) {

  }

  private get currentUser(): UserInfo {
    const result = this.authService.auth.currentUser;

    if (!result) {
      throw new Error('User is not logged in.');
    }

    return result;
  }

  getEntries(): Observable<Entry[]> {
    return this.db.collection<any>('users')
      .doc(this.currentUser.uid)
      .collection<any>('entries', ref => {
        return ref.orderBy('addedOn', 'desc');
      })
      .snapshotChanges()
      .first()
      .map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as FirebaseEntry;
          const id = a.payload.doc.id;

          return new Entry({
            id: id,
            originalText: data.originalText,
            translation: data.translation,
            addedOn: data.addedOn ? new Date(data.addedOn) : undefined,
            updatedOn: data.updatedOn ? new Date(data.updatedOn) : undefined
          });
        });
      });
  }

  async addOrUpdate(entry: Entry): Promise<void> {
    const entryData: FirebaseEntry = {
      originalText: entry.originalText,
      translation: entry.translation,
      addedOn: entry.addedOn ? entry.addedOn.valueOf() : undefined,
      updatedOn: entry.updatedOn ? entry.updatedOn.valueOf() : undefined
    };

    const collectionRef = this.db
      .collection<any>('users')
      .doc(this.currentUser.uid)
      .collection<any>('entries');

    if (entry.id) {
      await collectionRef.doc(entry.id).set(entryData);
    }
    else {
      const newEntryRef = await collectionRef.add(entryData);
      entry.id = newEntryRef.id;
    }
  }

  async delete(id: string): Promise<void> {

    await this.db
      .collection<any>('users')
      .doc(this.currentUser.uid)
      .collection('entries')
      .doc(id)
      .delete();
  }
}
