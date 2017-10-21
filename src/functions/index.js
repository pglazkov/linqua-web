const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const request = require('request-promise');
const xmldoc = require('xmldoc');

exports.translate = functions.database.ref('/translations/{translationId}').onWrite(event => {
  // Only run when the object is created
  if (event.data.previous.exists()) {
    return;
  }
  // Do nothing on deletion
  if (!event.data.exists()) {
    return;
  }

  const snapshot = event.data;
  const key = snapshot.key;
  const targetLang = 'en';

  const options = {
    uri: 'http://api.microsofttranslator.com/v2/http.svc/translate',
    qs: {
      text: key,
      to: targetLang
    },
    headers: {
      'Ocp-Apim-Subscription-Key': functions.config().translateapi.key
    },
    json: false,
    resolveWithFullResponse: true
  };

  let translation = {}
  return request(options).then(
    response => {
      if (response.statusCode === 200) {
        let bodyDoc = new xmldoc.XmlDocument(response.body);
        translation[targetLang] = bodyDoc.val;
        return admin.database().ref(`/translations/${key}`).update(translation);
      }
      else throw response.body;
    });
});
