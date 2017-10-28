import { Injectable } from '@angular/core';
import { Translation } from './translation';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth';

@Injectable()
export class TranslationService {
  constructor(private http: HttpClient, private authService: AuthService) {

  }

  async translate(text: string): Promise<Translation> {
    const authToken = await this.authService.getAuthToken();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + authToken
    });

    const translation = await this.http.get<Translation>(`/api/translate?q=${text}`, { headers: headers } ).toPromise();

    return translation;
  }
}
