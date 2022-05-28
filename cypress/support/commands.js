import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { firebaseConfig } from '@linqua/firebase-config';

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

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

if (Cypress.env('USE_EMULATOR')) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

Cypress.Commands.add('login', () => {
  cy.logout();
  if (Cypress.env('CREATE_TEST_ACCOUNT')) {
    cy.createTestAccount();
  }
  cy.loginWithTestAccount();
});

Cypress.Commands.add('loginWithTestAccount', () => {
  const pass = Cypress.env('E2E_TEST_ACCOUNT_PASS');
  if (!pass) {
    throw new Error('E2E_TEST_ACCOUNT_PASS environment variable is not set. Please set it with a password for e2e.ci2@linqua-app.com account.');
  }

  return new Cypress.Promise((resolve, reject) => {
    return signInWithEmailAndPassword(auth, 'e2e.ci2@linqua-app.com', Cypress.env('E2E_TEST_ACCOUNT_PASS'))
      .then(resolve, reject);
  });
});

Cypress.Commands.add('createTestAccount', () => {
  // On the development machine, the E2E_TEST_ACCOUNT_PASS environment variable can be set in command line as `export CYPRESS_E2E_TEST_ACCOUNT_PASS=<password>`
  // or permanently stored in ~/.bash_profile.
  const pass = Cypress.env('E2E_TEST_ACCOUNT_PASS');
  if (!pass) {
    throw new Error('E2E_TEST_ACCOUNT_PASS environment variable is not set. Please set it with a password for e2e.ci2@linqua-app.com account.');
  }

  return new Cypress.Promise((resolve, reject) => {
    return createUserWithEmailAndPassword(auth, 'e2e.ci2@linqua-app.com', Cypress.env('E2E_TEST_ACCOUNT_PASS'))
      .catch(error => {
        switch (error.code) {
          case 'auth/email-already-in-use':
            // Test user already exists, skipping creation.
            break;
          default:
            throw error;
        }
    })
    .then(resolve, reject);
  });
});

Cypress.Commands.add('logout', () =>{ 
  return new Cypress.Promise((resolve, reject) => {
    signOut(auth).then(resolve, reject);
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
