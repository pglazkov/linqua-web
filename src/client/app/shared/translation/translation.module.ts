import { NgModule } from '@angular/core';
import { TranslationService } from './translation.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

@NgModule({
  exports: [],
  declarations: [],
  imports: [],
  providers: [
    TranslationService,
    provideHttpClient(withInterceptorsFromDi()),
  ]
})
export class TranslationModule {
}
