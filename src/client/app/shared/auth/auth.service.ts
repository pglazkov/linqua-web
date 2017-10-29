import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthErrorCodes } from './firebase-auth-error-codes';
import { auth } from 'firebase/app';
import { Subject } from 'rxjs/Subject';

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

@Injectable()
export class AuthService {
  private isLoggedInChange: Subject<boolean> = new Subject<boolean>();

  constructor(private af: AngularFireAuth) {
    af.auth.onAuthStateChanged(() => {
      this.isLoggedInChange.next(this.isLoggedIn);
    });
  }

  get userId(): string {
    if (!this.af.auth.currentUser) {
      throw new Error('User is not logged in (yet). Please check "isLoggedIn"` before accessing the "userId" property.');
    }

    return this.af.auth.currentUser.uid;
  }

  get user(): User {
    if (!this.af.auth.currentUser) {
      throw new Error('User is not logged in (yet). Please check "isLoggedIn"` before accessing the "user" property.');
    }

    const user = this.af.auth.currentUser;

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

  get isLoggedIn(): boolean {
    return !!this.af.auth.currentUser;
  }

  loginWithFacebook(): void {
    this.login(new auth.FacebookAuthProvider());
  }

  loginWithGoogle(): void {
    this.login(new auth.GoogleAuthProvider());
  }

  async handleLoginResultIfNeeded(): Promise<AuthResult | undefined> {
    if (this.isLoggedIn) {
      return undefined;
    }

    try {
      const redirectResult = await this.af.auth.getRedirectResult();

      console.log(redirectResult);

      if (redirectResult && redirectResult.credential) {

        const accountToLinkData = sessionStorage.getItem(accountToLinkStorageKey);
        const accountToLink = accountToLinkData ? JSON.parse(accountToLinkData) : undefined;

        if (accountToLink) {
          await redirectResult.credential.linkWithCredential(accountToLink);
          sessionStorage.removeItem(accountToLinkStorageKey);
        }

        return { success: true };
      }

      return undefined;
    }
    catch (error) {
      if (error.code === AuthErrorCodes.AccountExistsWithDifferentCredential) {
        const availableProviders = await this.af.auth.fetchProvidersForEmail(error.email);

        sessionStorage.setItem(accountToLinkStorageKey, JSON.stringify(error.credential));

        return {
          success: false,
          error: 'There is already an account with this email. Please login using ' + availableProviders
        };
      }

      console.error(error);

      return { success: false, error: JSON.stringify(error) };
    }
  }

  private login(provider: auth.AuthProvider): void {
    this.af.auth.signInWithRedirect(provider).then(() => {}, err => console.error(err));
  }

  async logout() {
    await this.af.auth.signOut();
  }
}
