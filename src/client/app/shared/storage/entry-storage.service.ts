import { Injectable } from '@angular/core';
import { Entry } from '../model';
import { Observable } from 'rxjs/observable';
import { AngularFirestore } from 'angularfire2/firestore';
import { AuthService } from '../auth';

interface FirebaseEntry {
  originalText: string;
  translation?: string;
  addedOn?: number;
  updatedOn?: number;
}

@Injectable()
export class EntryStorageService {

  constructor(private db: AngularFirestore, private authService: AuthService) {

  }

  getEntries(): Observable<Entry[]> {
    return this.db.collection<any>('users')
      .doc(this.authService.userId)
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
      .doc(this.authService.userId)
      .collection<any>('entries');

    if (entry.id) {
      await collectionRef.doc(entry.id).set(entryData);
    }
    else {
      const newEntryRef = await collectionRef.add(entryData);
      entry.id = newEntryRef.id;
    }
  }

  delete(id: string): Promise<void> {
    return this.db
      .collection<any>('users')
      .doc(this.authService.userId)
      .collection('entries')
      .doc(id)
      .delete();
  }
}
