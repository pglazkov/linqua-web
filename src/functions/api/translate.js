const fetch = require('node-fetch');
const secrets = require('../util/secrets');

module.exports = (req, res) => {
  const original = req.query.q;

  if (!original) {
    res.status(400).send(`Please specify the text to translate with the "q" parameter, e.g.: ?q=cat`);
  }

  const targetLang = req.query.target || 'en';

  console.log(`[translate] Execution started for text: "${original}"`);

  const url =
    `https://www.googleapis.com/language/translate/v2?` +
    `key=${secrets.values.translateApiKey}&q=${original}&target=${targetLang}`;

  console.log('[translate] Request to Translate API: ' + url);

  fetch(url).then(response => {
    console.log('[translate] Response from Translate API (status): ' + response.statusText);
    if (response.status === 200) {
      return response.json().then(json => {
        const translation = {};

        console.log('[translate] Response from Translate API (content): ' + JSON.stringify(json));

        const firstTranslation = json.data.translations[0];

        translation.detectedSourceLanguage = firstTranslation.detectedSourceLanguage;
        translation[targetLang] = firstTranslation.translatedText;

        res.status(200).json(translation);
      });
    } else {
      console.log('[translate] Response from Translate API (error body): ' + response.body);
      res.status(500).send(response.body);
    }
  });
};
