import { Injectable } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods } from 'angularfire2';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

export interface User {
  name: string;
  avatarUrl?: string;
  email?: string;
  provider: string;
}

@Injectable()
export class AuthService {
  redirectUrl: string;
  
  constructor(private af: AngularFire) {
    this.af.auth.subscribe(auth => console.log(auth));
  }  

  get loggedInUser(): Observable<User | undefined> {
    return this.af.auth.map(state => {
      if (!state) {
        return undefined;
      }

      const providerData = state.auth.providerData[0];

      return {
        name: providerData.displayName,
        avatarUrl: providerData.photoURL,
        email: providerData.email,
        provider: providerData.providerId
      };
    });
  }

  get isLoggedIn() {
    return this.loggedInUser.map(x => !!x);
  }

  async login(provider: AuthProviders, method: AuthMethods) {
    try {
      await this.af.auth.login({
        provider: provider,
        method: method,
      });

      return true;
    }
    catch (error) {
      return false;
    }    
  }

  async logout() {
    await this.af.auth.logout();
  }
}
