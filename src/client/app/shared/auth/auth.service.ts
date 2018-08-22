import { Injectable } from '@angular/core';
import { FirebaseApp } from 'ng-firebase-lite';
import { AuthErrorCodes } from './firebase-auth-error-codes';
import { Observable, ReplaySubject } from 'rxjs';
import * as firebase from 'firebase/app';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: string;
  uid: string;
}

const accountToLinkStorageKey = 'account-to-link';
const loginWithRedirectInProgressKey = 'login-with-redirect-in-progress';

@Injectable()
export class AuthService {
  private isLoggedInValueSubject: ReplaySubject<boolean> = new ReplaySubject<boolean>();
  private readonly auth: firebase.auth.Auth;

  constructor(private fba: FirebaseApp) {
    this.auth = fba.auth();

    this.auth.onAuthStateChanged(() => {
      this.isLoggedInValueSubject.next(!!this.auth.currentUser);
    });
  }

  get userId(): string {
    if (!this.auth.currentUser) {
      throw new Error('User is not logged in (yet). Please check "isLoggedIn"` before accessing the "userId" property.');
    }

    return this.auth.currentUser.uid;
  }

  get user(): User {
    if (!this.auth.currentUser) {
      throw new Error('User is not logged in (yet). Please check "isLoggedIn"` before accessing the "user" property.');
    }

    const user = this.auth.currentUser;

    let photoURL: string | null = user.photoURL;
    const providerId: string = user.providerData.map(p => p ? p.providerId : '').join('/');

    if (user.providerData.length > 0) {
      const providerUserInfo = user.providerData[0];

      if (providerUserInfo) {
        photoURL = providerUserInfo.photoURL;
      }
    }

    return {
      displayName: user.displayName,
      email: user.email,
      photoURL: photoURL,
      providerId: providerId,
      uid: user.uid
    };
  }

  get isLoggedIn(): Observable<boolean> {
    return this.isLoggedInValueSubject.asObservable();
  }

  get shouldHandleRedirectResult() {
    return !!sessionStorage.getItem(loginWithRedirectInProgressKey);
  }

  loginWithFacebook(): void {
    this.login(new firebase.auth.FacebookAuthProvider());
  }

  loginWithGoogle(): void {
    this.login(new firebase.auth.GoogleAuthProvider());
  }

  async loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    await this.auth.signInWithEmailAndPassword(email, password);
  }

  async handleRedirectResult(): Promise<AuthResult | undefined> {
    try {
      const redirectResult = await this.auth.getRedirectResult();

      if (redirectResult && redirectResult.credential) {

        const accountToLinkData = sessionStorage.getItem(accountToLinkStorageKey);
        const accountToLink = accountToLinkData ? this.getCredentialInstance(JSON.parse(accountToLinkData)) : undefined;

        if (accountToLink && redirectResult.user) {
          await redirectResult.user.linkWithCredential(accountToLink);
          sessionStorage.removeItem(accountToLinkStorageKey);
        }

        return { success: true };
      }

      return undefined;
    }
    catch (error) {
      if (error.code === AuthErrorCodes.AccountExistsWithDifferentCredential) {
        const availableProviders = await this.auth.fetchProvidersForEmail(error.email);

        sessionStorage.setItem(accountToLinkStorageKey, JSON.stringify(error.credential));

        return {
          success: false,
          error: 'There is already an account with this email. Please login using ' + availableProviders
        };
      }

      console.error(error);

      return { success: false, error: JSON.stringify(error) };
    }
    finally {
      sessionStorage.removeItem(loginWithRedirectInProgressKey);
    }
  }

  private login(provider: firebase.auth.AuthProvider): void {
    sessionStorage.setItem(loginWithRedirectInProgressKey, 'true');

    this.auth.signInWithRedirect(provider).then(() => {}, err => console.error(err));
  }

  private getCredentialInstance(credentialData: any) {
    switch (credentialData.providerId) {
      case 'facebook.com':
        return firebase.auth.FacebookAuthProvider.credential(credentialData.accessToken);
      case 'google.com':
        return firebase.auth.GoogleAuthProvider.credential(credentialData.idToken, credentialData.accessToken);
      default:
        throw new Error(`Provider "${credentialData.providerId}" is not supported.`);
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}
