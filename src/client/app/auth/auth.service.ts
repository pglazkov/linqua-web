import { inject, Injectable } from '@angular/core';
import {
  AuthProvider,
  FacebookAuthProvider,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithCredential,
  OAuthCredential,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from 'firebase/auth';
import { map, Observable, ReplaySubject } from 'rxjs';

import { firebaseAuthToken } from '../firebase';
import { FirebaseAuthErrorCode } from './firebase-auth-error-code';

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

// TODO: Update Firebase Auth error handling and use official types
interface LegacyAuthError {
  code: string;
  email: string;
  credential: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(firebaseAuthToken);

  private readonly userSubject: ReplaySubject<User | undefined> = new ReplaySubject<User | undefined>(1);

  constructor() {
    this.auth.onAuthStateChanged(() => {
      this.userSubject.next(this.getCurrentUser());
    });
  }

  get userId(): string {
    if (!this.auth.currentUser) {
      throw new Error(
        'User is not logged in (yet). Please check "isLoggedIn"` before accessing the "userId" property.',
      );
    }

    return this.auth.currentUser.uid;
  }

  get user$(): Observable<User | undefined> {
    return this.userSubject.asObservable();
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.user$.pipe(map(user => !!user));
  }

  get shouldHandleRedirectResult() {
    return !!sessionStorage.getItem(loginWithRedirectInProgressKey);
  }

  loginWithFacebook(): void {
    this.login(new FacebookAuthProvider());
  }

  loginWithGoogle(): void {
    this.login(new GoogleAuthProvider());
  }

  async loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async handleRedirectResult(): Promise<AuthResult | undefined> {
    try {
      const redirectResult = await getRedirectResult(this.auth);

      if (redirectResult) {
        const accountToLinkData = sessionStorage.getItem(accountToLinkStorageKey);
        const accountToLink = accountToLinkData ? this.getCredentialInstance(JSON.parse(accountToLinkData)) : undefined;

        if (accountToLink && redirectResult.user) {
          await linkWithCredential(redirectResult.user, accountToLink);
          sessionStorage.removeItem(accountToLinkStorageKey);
        }

        return { success: true };
      }

      return undefined;
    } catch (error) {
      const authError = error as LegacyAuthError;

      if (authError.code === FirebaseAuthErrorCode.AccountExistsWithDifferentCredential) {
        const availableProviders = await fetchSignInMethodsForEmail(this.auth, authError.email);

        sessionStorage.setItem(accountToLinkStorageKey, JSON.stringify(authError.credential));

        return {
          success: false,
          error: 'There is already an account with this email. Please login using ' + availableProviders,
        };
      }

      console.error(error);

      return { success: false, error: JSON.stringify(error) };
    } finally {
      sessionStorage.removeItem(loginWithRedirectInProgressKey);
    }
  }

  async logout() {
    await this.auth.signOut();
  }

  private login(provider: AuthProvider): void {
    sessionStorage.setItem(loginWithRedirectInProgressKey, 'true');

    signInWithRedirect(this.auth, provider).then(
      () => {},
      err => console.error(err),
    );
  }

  private getCredentialInstance(credentialData: OAuthCredential) {
    switch (credentialData.providerId) {
      case 'facebook.com':
        return FacebookAuthProvider.credential(credentialData.accessToken!);
      case 'google.com':
        return GoogleAuthProvider.credential(credentialData.idToken, credentialData.accessToken);
      default:
        throw new Error(`Provider "${credentialData.providerId}" is not supported.`);
    }
  }

  private getCurrentUser(): User | undefined {
    if (!this.auth.currentUser) {
      return undefined;
    }

    const user = this.auth.currentUser;

    let photoURL: string | null = user.photoURL;
    const providerId: string = user.providerData.map(p => (p ? p.providerId : '')).join('/');

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
      uid: user.uid,
    };
  }
}
