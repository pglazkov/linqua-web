import { inject, Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { functionsToken } from '../firebase';
import { Translation } from './translation';

interface TranslateRequest {
  q: string;
  target: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly firebaseFunctions = inject(functionsToken);
  private readonly getTranslationFn = httpsCallable<TranslateRequest, Translation>(this.firebaseFunctions, 'translate');

  async translate(text: string): Promise<Translation> {
    return (await this.getTranslationFn({ q: text, target: 'en' })).data;
  }
}
