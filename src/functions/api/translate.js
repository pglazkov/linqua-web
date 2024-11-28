const fetch = require('node-fetch');
const secrets = require('../util/secrets');

module.exports = async (req, res, next) => {
  try {
    const original = req.query.q;

    if (!original) {
      return res.status(400).send(`Please specify the text to translate with the "q" parameter, e.g.: ?q=cat`);
    }

    const targetLang = req.query.target || 'en';

    console.log(`[translate] Execution started for text: "${original}"`);

    const translateApiKey = secrets.values.translateApiKey;

    if (!translateApiKey) {
      console.error(
        `[translate] No Translate API key, please make sure the secret "${secrets.keys.translateApiKey}" is set.`,
      );
      return res.status(500).send('No Translate API key');
    }

    const url = `https://www.googleapis.com/language/translate/v2?` +
      `key=${translateApiKey}&q=${original}&target=${targetLang}`;

    console.log('[translate] Request to Translate API: ' + JSON.stringify({ original, targetLang }));

    const response = await fetch(url);

    console.log('[translate] Response from Translate API (status): ' + response.statusText);

    const json = await response.json();

    if (response.status === 200) {
      console.log('[translate] Response from Translate API (content)', JSON.stringify(json));

      const translation = {
        detectedSourceLanguage: json.data.translations[0].detectedSourceLanguage,
        [targetLang]: json.data.translations[0].translatedText,
      };

      return res.status(200).json(translation);
    } else {
      console.error('Translate API request failed', response.status, json);
      return res.status(500).send('Received unexpected response from Translate API');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Unknown error occurred.');
  }
};
