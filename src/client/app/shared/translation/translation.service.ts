import { Injectable } from '@angular/core';
import { Translation } from './translation';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TranslationService {
  constructor(private http: HttpClient) {
  }

  async translate(text: string): Promise<Translation> {
    const translation = await this.http.get<Translation>(`/api/translate?q=${text}`).toPromise();

    return translation;
  }
}
