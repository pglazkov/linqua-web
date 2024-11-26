const TRANSLATE_API_KEY = 'TRANSLATE_API_KEY';

exports.values = {
  get translateApiKey() {
    return process.env[TRANSLATE_API_KEY];
  },
};
exports.keys = {
  translateApiKey: TRANSLATE_API_KEY,
  all: [TRANSLATE_API_KEY],
};
