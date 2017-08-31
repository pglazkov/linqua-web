import { NgModule } from '@angular/core';
import { EntryStorageService } from './entry-storage.service';
import { AngularFireDatabaseModule } from 'angularfire2/database';

@NgModule({
  imports: [
    AngularFireDatabaseModule
  ],
  exports: [],
  declarations: [],
  providers: [EntryStorageService],
})
export class StorageModule {
}
