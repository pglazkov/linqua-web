const functions = require('firebase-functions');
const request = require('request-promise');

module.exports = (req, res) => {
  const original = req.query.q;

  if (!original) {
    res.status(400).send(`Please specify the text to translate with the "q" parameter, e.g.: ?q=cat`);
  }

  const targetLang = req.query.target || 'en';

  console.log(`[translate] Execution started for text: "${original}"`);

  const options = {
    uri: 'https://www.googleapis.com/language/translate/v2',
    qs: {
      key: functions.config().translateapi.key,
      q: original,
      target: targetLang
    },
    json: true,
    resolveWithFullResponse: true
  };

  console.log("[translate] Request to Translate API: " + JSON.stringify(options));

  request(options).then(
    response => {
      console.log('[translate] Response from Translate API: ' + JSON.stringify(response));

      if (response.statusCode === 200) {
        let translation = {};

        let firstTranslation = response.body.data.translations[0];

        translation.detectedSourceLanguage = firstTranslation.detectedSourceLanguage;
        translation[targetLang] = firstTranslation.translatedText;

        res.status(200).json(translation);
      }
      else {
        res.status(500).send(response.body);
      }
    });
}
