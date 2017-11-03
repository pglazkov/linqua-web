import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthErrorCodes } from './firebase-auth-error-codes';
import { auth } from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AsyncSubject } from 'rxjs/AsyncSubject';

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
  private isLoggedInValueSubject: AsyncSubject<boolean> = new AsyncSubject<boolean>();
  private isLoggedInValueAvailable = false;

  constructor(private af: AngularFireAuth) {
    af.auth.onAuthStateChanged(() => {
      if (this.isLoggedInValueAvailable) {
        // isLoggedInValueSubject is completed and contains a previous value.
        // We need to "reset" the subject and emit the new value.
        this.isLoggedInValueSubject = new AsyncSubject<boolean>();
      }

      this.isLoggedInValueAvailable = true;
      this.isLoggedInValueSubject.next(!!this.af.auth.currentUser);
      this.isLoggedInValueSubject.complete();
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

  get isLoggedIn(): Observable<boolean> {
    return this.isLoggedInValueSubject.asObservable();
  }

  loginWithFacebook(): void {
    this.login(new auth.FacebookAuthProvider());
  }

  loginWithGoogle(): void {
    this.login(new auth.GoogleAuthProvider());
  }

  loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    return this.af.auth.signInWithEmailAndPassword(email, password);
  }

  async handleLoginResultIfNeeded(): Promise<AuthResult | undefined> {
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
