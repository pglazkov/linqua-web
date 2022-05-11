import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyAzraaEABvAbytZVZRVlguP7XEB1hjY_dE',
  authDomain: 'linqua-cab88.firebaseapp.com',
  projectId: 'linqua-cab88',
  storageBucket: 'linqua-cab88.appspot.com',
  messagingSenderId: '64353876836'
});

const auth = getAuth(firebaseApp);

Cypress.Commands.add('login', () => {
  return new Cypress.Promise((resolve, reject) => {
    auth.signOut().then(() => {

      // On the development machine, the E2E_TEST_ACCOUNT_PASS environment variable can be set in command line as `export CYPRESS_E2E_TEST_ACCOUNT_PASS=<password>`
      // or permanently stored in ~/.bash_profile.
      const pass = Cypress.env('E2E_TEST_ACCOUNT_PASS');
      if (!pass) {
        throw new Error('E2E_TEST_ACCOUNT_PASS environment variable is not set. Please set it with a password for e2e.ci2@linqua-app.com account.');
      }

      return signInWithEmailAndPassword(auth, 'e2e.ci2@linqua-app.com', Cypress.env('E2E_TEST_ACCOUNT_PASS'));
    }).then(resolve, reject);
  });
});

Cypress.Commands.add('logout', () =>{ 
  return new Cypress.Promise((resolve, reject) => {
    auth.signOut().then(resolve, reject);
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
