import { InjectionToken } from '@angular/core';
import { FirebaseOptions } from 'firebase/app';

export const firebaseAppConfigToken = new InjectionToken<FirebaseOptions>('FIREBASE_OPTIONS');
