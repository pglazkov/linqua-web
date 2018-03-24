import { Injectable } from '@angular/core';
import { FirebaseApp } from '../firebase';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import { AuthErrorCodes } from './firebase-auth-error-codes';
import { auth } from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

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
  private readonly auth: auth.Auth;

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
    this.login(new auth.FacebookAuthProvider());
  }

  loginWithGoogle(): void {
    this.login(new auth.GoogleAuthProvider());
  }

  loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  async handleRedirectResult(): Promise<AuthResult | undefined> {
    try {
      const redirectResult = await this.auth.getRedirectResult();

      if (redirectResult && redirectResult.credential) {

        const accountToLinkData = sessionStorage.getItem(accountToLinkStorageKey);
        const accountToLink = accountToLinkData ? this.getCredentialInstance(JSON.parse(accountToLinkData)) : undefined;

        if (accountToLink) {
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

  private login(provider: auth.AuthProvider): void {
    sessionStorage.setItem(loginWithRedirectInProgressKey, 'true');

    this.auth.signInWithRedirect(provider).then(() => {}, err => console.error(err));
  }

  private getCredentialInstance(credentialData: any) {
    switch (credentialData.providerId) {
      case 'facebook.com':
        return auth.FacebookAuthProvider.credential(credentialData.accessToken);
      case 'google.com':
        return auth.GoogleAuthProvider.credential(credentialData.idToken, credentialData.accessToken);
      default:
        throw new Error(`Provider "${credentialData.providerId}" is not supported.`);
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}
