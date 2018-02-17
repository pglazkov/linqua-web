import { NgModule } from '@angular/core';
import { EntryStorageService } from './entry-storage.service';

import 'firebase/firestore';

@NgModule({
  imports: [

  ],
  exports: [],
  declarations: [],
  providers: [EntryStorageService],
})
export class StorageModule {
}
