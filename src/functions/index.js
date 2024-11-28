const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const tokenValidationMiddleware = require('./auth/firebase-token-validation-middleware');
const translateApi = require('./api/translate');
const randomApi = require('./api/random');
const secrets = require('./util/secrets');

// see https://firebase.google.com/docs/functions/writing-and-viewing-logs?gen=2nd
require('firebase-functions/logger/compat');

if (!admin.apps.length) {
  admin.initializeApp();
}

const main = express();
const api = express();

main.use('/api', api);

api.use(cors({ origin: true }));
api.use(cookieParser());
api.use(tokenValidationMiddleware);
api.get('/translate', translateApi);
api.get('/random', randomApi);

// API entry point
exports.main = onRequest({ cors: true, secrets: secrets.keys.all }, main);

// Firestore Triggers
exports.entriesArchiveCountUpdate = require('./firestore-triggers/update-user-collection-count')('entries-archive');
exports.entriesCountUpdate = require('./firestore-triggers/update-user-collection-count')('entries');
