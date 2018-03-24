const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const tokenValidationMiddleware = require('./firebase-token-validation-middleware');
const translateApi = require('./api/translate');
const randomApi = require('./api/random');

const main = express();
const api = express();

main.use('/api', api);

api.use(cors);
api.use(cookieParser);
api.use(tokenValidationMiddleware);
api.get('/translate', translateApi);
api.get('/random', randomApi);

// API entry point
exports.main = functions.https.onRequest(main);

// Firestore Triggers
exports.entriesArchiveCountUpdate = require('./firestore/update-user-collection-count')('entries-archive');
exports.entriesCountUpdate = require('./firestore/update-user-collection-count')('entries');
