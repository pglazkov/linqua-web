// @ts-check
const { onCall } = require('firebase-functions/v2/https');

const fetch = require('node-fetch');
const secrets = require('../util/secrets');

module.exports = onCall({ secrets: [secrets.keys.translateApiKey] }, async (req) => {
  const original = req.data.q;

  if (!original) {
    throw new Error(`Please specify the text to translate with the "q" parameter`);
  }

  const targetLang = req.data.target || 'en';

  console.log(`[translate] Execution started for text: "${original}"`);

  const translateApiKey = secrets.values.translateApiKey;

  if (!translateApiKey) {
    console.error(
      `[translate] No Translate API key, please make sure the secret "${secrets.keys.translateApiKey}" is set.`,
    );

    throw new Error('No Translate API key');
  }

  const url = `https://www.googleapis.com/language/translate/v2?` +
    `key=${translateApiKey}&q=${original}&target=${targetLang}`;

  console.log('[translate] Request to Translate API: ' + JSON.stringify({ original, targetLang }));

  const response = await fetch(url);

  console.log('[translate] Response from Translate API (status): ' + response.statusText);

  const json = await response.json();

  if (response.status === 200) {
    console.log('[translate] Response from Translate API (content)', JSON.stringify(json));

    return {
      detectedSourceLanguage: json.data.translations[0].detectedSourceLanguage,
      [targetLang]: json.data.translations[0].translatedText,
    };
  } else {
    console.error('Translate API request failed', response.status, json);
    throw new Error('Received unexpected response from Translate API');
  }
});
