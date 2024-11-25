import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Translation } from './translation';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  constructor(private http: HttpClient) {}

  async translate(text: string): Promise<Translation> {
    const translation = await firstValueFrom(this.http.get<Translation>(`/api/translate?q=${text}`));

    return translation;
  }
}
