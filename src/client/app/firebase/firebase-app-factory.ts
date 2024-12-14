import { NgZone } from '@angular/core';
import { environment } from 'environments/environment';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

export const firebaseAppFactory = (config: FirebaseOptions, zone: NgZone): FirebaseApp => {
  return zone.runOutsideAngular(() => {
    const app = initializeApp(config) as FirebaseApp;

    // See https://firebase.google.com/docs/app-check#get_started
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(environment.reCaptchaSiteKey),
      isTokenAutoRefreshEnabled: true, // Set to true to allow auto-refresh.
    });

    return app;
  });
};
