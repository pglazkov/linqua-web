import { NgModule } from '@angular/core';
import { EntryStorageService } from './entry-storage.service';
import { AngularFirestoreModule } from 'angularfire2/firestore';

@NgModule({
  imports: [
    AngularFirestoreModule
  ],
  exports: [],
  declarations: [],
  providers: [EntryStorageService],
})
export class StorageModule {
}