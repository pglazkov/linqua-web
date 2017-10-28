import { NgModule } from '@angular/core';
import { TranslationService } from './translation.service';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule, AngularFireDatabaseModule],
  exports: [],
  declarations: [],
  providers: [TranslationService],
})
export class TranslationModule {
}
