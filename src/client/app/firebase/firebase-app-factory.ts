import { NgZone } from '@angular/core';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';

export const firebaseAppFactory = (config: FirebaseOptions, zone: NgZone): FirebaseApp => {
  return zone.runOutsideAngular(() => initializeApp(config) as FirebaseApp);
};
