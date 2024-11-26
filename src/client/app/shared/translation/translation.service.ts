import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Translation } from './translation';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);

  async translate(text: string): Promise<Translation> {
    const translation = await firstValueFrom(this.http.get<Translation>(`/api/translate?q=${text}`));

    return translation;
  }
}
