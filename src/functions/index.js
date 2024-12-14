// see https://firebase.google.com/docs/functions/writing-and-viewing-logs?gen=2nd
require('firebase-functions/logger/compat');

// Callable Functions
exports.translate = require('./api/translate');
exports.getRandomEntriesBatch = require('./api/get-random-entries-batch');

// Firestore Triggers
exports.entriesArchiveCountUpdate = require('./firestore-triggers/update-user-collection-count')('entries-archive');
exports.entriesCountUpdate = require('./firestore-triggers/update-user-collection-count')('entries');
