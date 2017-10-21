import { NgModule } from '@angular/core';
import { TranslationService } from './translation.service';
import { AngularFireDatabaseModule } from 'angularfire2/database';

@NgModule({
  imports: [AngularFireDatabaseModule],
  exports: [],
  declarations: [],
  providers: [TranslationService],
})
export class TranslationModule {
}
