import { Component, OnInit } from '@angular/core';
import { AuthResult, AuthService } from 'shared';
import { Router, ActivatedRoute } from '@angular/router';

export enum AuthProviders {
  facebook,
  google
}

@Component({
  selector: 'app-login-view',
  templateUrl: './login-view.component.html',
  styleUrls: ['./login-view.component.scss']
})
export class LoginViewComponent implements OnInit {

  providers = AuthProviders;
  errorMessage: string | undefined;
  isHandlingSignInResult = false;

  constructor(public af: AuthService, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  async ngOnInit() {
    this.isHandlingSignInResult = true;
    try {
      const authResult = await this.af.handleLoginResultIfNeeded();

      if (authResult) {
        this.continueLogin(authResult);
      }
    }
    finally {
      this.isHandlingSignInResult = false;
    }
  }

  get isLoggedIn() {
    return this.af.isLoggedIn;
  }

  get user() {
    return this.af.user;
  }

  login(provider: AuthProviders): void {
    switch (provider) {
      case AuthProviders.facebook:
        this.af.loginWithFacebook();
        break;
      case AuthProviders.google:
        this.af.loginWithGoogle();
        break;
      default:
        throw new Error(`Provider "${provider}" is not supported.`);
    }
  }

  continueLogin(authResult: AuthResult) {
    const redirectUrl = this.activatedRoute.snapshot.queryParams['redirectUrl'];

    if (authResult.success && redirectUrl) {
      this.router.navigate([redirectUrl]);
    }
    else {
      this.errorMessage = authResult.error;
    }
  }

  logout() {
    return this.af.logout();
  }
}
