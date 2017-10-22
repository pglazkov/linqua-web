const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const request = require('request-promise');

exports.translate = functions.database.ref('/translations/{translationId}').onWrite(event => {
  // Only run when the object is created
  if (event.data.previous.exists()) {
    return Promise.resolve(true);
  }
  // Do nothing on deletion
  if (!event.data.exists()) {
    return Promise.resolve(true);
  }

  const snapshot = event.data;
  const key = snapshot.key;
  const targetLang = 'en';

  const options = {
    uri: 'https://www.googleapis.com/language/translate/v2',
    qs: {
      key: functions.config().firebase.apiKey,
      q: key,
      target: targetLang
    },
    json: true,
    resolveWithFullResponse: true
  };

  console.log("Request to Translate API: " + JSON.stringify(options));

  return request(options).then(
    response => {
      console.log('Response from Translate API: ' + JSON.stringify(response));

      if (response.statusCode === 200) {
        let translation = {};

        let firstTranslation = response.body.data.translations[0];

        translation.detectedSourceLanguage = firstTranslation.detectedSourceLanguage;
        translation[targetLang] = firstTranslation.translatedText;

        return admin.database().ref(`/translations/${key}`).update(translation);
      }
      else {
        throw response.body;
      }
    });
});
