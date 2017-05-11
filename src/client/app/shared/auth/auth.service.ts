import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/timeoutWith';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/publishReplay';
import { ObservableCache } from '../utils';
import AuthErrorCodes from './firebase-auth-error-codes';

export interface User {
  name: string;
  avatarUrl?: string;
  email?: string;
  provider: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  errorRetryPayload?: any;
}

@Injectable()
export class AuthService implements OnDestroy { 
  private authStateCache: ObservableCache<User | undefined>;
  
  constructor(private af: AngularFireAuth) {
    this.authStateCache = new ObservableCache<User | undefined>(() => this.doGetLoggedInUser());    

    af.auth.onAuthStateChanged(() => {
      this.authStateCache.invalidate();
    });
  }  

  ngOnDestroy(): void {
    this.authStateCache.dispose();
  }
  
  get loggedInUser(): Observable<User | undefined> {
    return this.authStateCache.get();
  }

  get isLoggedIn() {
    return this.loggedInUser.map(user => !!user);
  }
  
  loginWithFacebook(retryPayload?: any) {
    return this.login(new firebase.auth.FacebookAuthProvider(), retryPayload);
  }

  loginWithGoogle(retryPayload?: any) {
    return this.login(new firebase.auth.GoogleAuthProvider(), retryPayload);
  }

  private async login(provider: firebase.auth.AuthProvider, retryPayload?: any): Promise<AuthResult> {
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

  private doGetLoggedInUser(): Observable<User | undefined> {
    return this.af.authState.map(state => {
      if (!state) {
        return undefined;
      }

      const providerData = state.providerData[0];

      return {
        name: providerData.displayName,
        avatarUrl: providerData.photoURL,
        email: providerData.email,
        provider: providerData.providerId
      };
    });
  }
}
