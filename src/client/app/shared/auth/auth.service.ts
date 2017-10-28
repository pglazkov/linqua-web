import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import AuthErrorCodes from './firebase-auth-error-codes';
import { Observable, ObservableCache } from '../rx';
import { UserInfo, auth } from 'firebase/app';
import { HttpHeaders } from '@angular/common/http';

export interface AuthResult {
  success: boolean;
  error?: string;
  errorRetryPayload?: any;
}

@Injectable()
export class AuthService implements OnDestroy {
  private authStateCache: ObservableCache<UserInfo | undefined>;

  constructor(private af: AngularFireAuth) {
    this.authStateCache = new ObservableCache<UserInfo | undefined>(() => this.doGetLoggedInUser());

    af.auth.onAuthStateChanged(() => {
      this.authStateCache.invalidate();
    });
  }

  ngOnDestroy(): void {
    this.authStateCache.dispose();
  }

  get loggedInUser(): Observable<UserInfo | undefined> {
    return this.authStateCache.get();
  }

  get isLoggedIn() {
    return this.loggedInUser.map(user => !!user);
  }

  loginWithFacebook(retryPayload?: any) {
    return this.login(new auth.FacebookAuthProvider(), retryPayload);
  }

  loginWithGoogle(retryPayload?: any) {
    return this.login(new auth.GoogleAuthProvider(), retryPayload);
  }

  getAuthToken() {
    const user = this.af.auth.currentUser;

    if (!user) {
      throw new Error('User is not authenticated.');
    }

    return user.getIdToken();
  }

  private async login(provider: auth.AuthProvider, retryPayload?: any): Promise<AuthResult> {
    try {
      await this.af.auth.signInWithPopup(provider);

      if (retryPayload && this.af.auth.currentUser) {
        await this.af.auth.currentUser.linkWithCredential(retryPayload);
      }

      return { success: true };
    }
    catch (error) {
      if (error.code === AuthErrorCodes.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL) {
        const availableProviders = await this.af.auth.fetchProvidersForEmail(error.email);

        return {
          success: false,
          error: 'There is already an account with this email. Please login using ' + availableProviders,
          errorRetryPayload: error.credential
        };
      }

      console.error(error);

      return { success: false, error: JSON.stringify(error) };
    }
  }

  async logout() {
    await this.af.auth.signOut();
  }

  private doGetLoggedInUser(): Observable<UserInfo | undefined> {
    return this.af.authState.map(state => {
      if (!state) {
        return undefined;
      }

      const providerData = state.providerData[0];

      if (!providerData) {
        return undefined;
      }

      return providerData;
    });
  }
}
