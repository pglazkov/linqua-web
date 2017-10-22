import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Translation } from './translation';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/timeout';

const timeoutInMilliseconds = 10000;

@Injectable()
export class TranslationService {
  constructor(private db: AngularFireDatabase) {

  }

  async translate(text: string): Promise<Translation> {
    // const data = { original: text };
    let result: Translation;

    // const matchingTranslationsSnapshot: DataSnapshot = await this.db.list('translations').query
    //   .orderByChild('original')
    //   .equalTo(text)
    //   .once('value');
    //
    // if (matchingTranslationsSnapshot.val() && matchingTranslationsSnapshot.hasChildren()) {
    //   result = (await matchingTranslationsSnapshot.ref.once('child_added')).val();
    // }

    const existingTranslation = await this.db.object(`translations/${text}`).query.once('value');

    if (existingTranslation && existingTranslation.val() && existingTranslation.val().en) {
      result = existingTranslation.val();
    }
    else {
      // Add an empty value and let the cloud function do the translation
      await this.db.object(`/translations/${text}`).set({ en: ''});

      try {
        // Wait for the translation
        result = await this.db.object(`translations/${text}`)
          .valueChanges()
          .filter((v: Translation) => {
            return !!v.en;
          })
          .first()
          .timeout(timeoutInMilliseconds)
          .toPromise() as Translation;
      }
      catch (e) {
        await this.db.object(`/translations/${text}`).remove();
        throw e;
      }
    }

    return result;

  }
}
