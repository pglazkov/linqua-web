import { NgModule } from '@angular/core';
import { TranslationService } from './translation.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule],
  exports: [],
  declarations: [],
  providers: [TranslationService],
})
export class TranslationModule {
}
