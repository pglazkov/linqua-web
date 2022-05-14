import { Injectable } from '@angular/core';
import { Translation } from './translation';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TranslationService {
  constructor(private http: HttpClient) {
  }

  async translate(text: string): Promise<Translation> {
    const translation = await firstValueFrom(this.http.get<Translation>(`/api/translate?q=${text}`));

    return translation;
  }
}
