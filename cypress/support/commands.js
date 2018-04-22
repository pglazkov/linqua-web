import * as firebase from 'firebase/app';
import 'firebase/auth';

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

const firebaseApp = firebase.initializeApp({
  apiKey: 'AIzaSyAzraaEABvAbytZVZRVlguP7XEB1hjY_dE',
  authDomain: 'linqua-cab88.firebaseapp.com',
  projectId: 'linqua-cab88',
  storageBucket: 'linqua-cab88.appspot.com',
  messagingSenderId: '64353876836'
});

Cypress.Commands.add('login', () => {
  return new Cypress.Promise((resolve, reject) => {
    firebase.auth().signOut().then(() => {

      // On the development machine, the E2E_TEST_ACCOUNT_PASS environment variable can be set in command line as `export CYPRESS_E2E_TEST_ACCOUNT_PASS=<password>`
      // or permanently stored in ~/.bash_profile.
      return firebaseApp.auth().signInWithEmailAndPassword('e2e.ci@linqua-app.com', Cypress.env('E2E_TEST_ACCOUNT_PASS'));
    }).then(resolve, reject);
  });
});

Cypress.Commands.add('logout', () => {
  return new Cypress.Promise((resolve, reject) => {
    firebase.auth().signOut().then(resolve, reject);
  });
});

Cypress.Commands.add('clearServiceWorkers', () => {
  const unregisterPromise = window.navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map((registration) => registration.unregister())));

  return new Cypress.Promise((resolve, reject) => unregisterPromise.then(resolve, reject));
});

Cypress.Commands.add('clearIndexedDBs', () => {
  return new Cypress.Promise((resolve, reject) => clearIndexedDb('firestore/[DEFAULT]/linqua-cab88/main').then(resolve, reject));
});

function clearIndexedDb(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
}
