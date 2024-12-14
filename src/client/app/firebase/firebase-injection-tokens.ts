import { InjectionToken } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';

export const firebaseAppToken = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const firebaseAuthToken = new InjectionToken<Auth>('FIREBASE_AUTH');
export const firestoreToken = new InjectionToken<Firestore>('FIRESTORE');
export const functionsToken = new InjectionToken<Functions>('FIREBASE_FUNCTIONS');
