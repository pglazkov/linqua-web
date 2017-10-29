import { Component, OnInit } from '@angular/core';
import { AuthService } from 'shared';
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
  loginErrorRetryPayload: any;

  constructor(public af: AuthService, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
  }

  get isLoggedIn() {
    return this.af.isLoggedIn;
  }

  get user() {
    return this.af.user;
  }

  async login(provider: AuthProviders) {
    const authResult = await this.getLoginFunctionForProvider(provider)();

    const redirectUrl = this.activatedRoute.snapshot.queryParams['redirectUrl'];

    if (authResult.success && redirectUrl) {
      this.router.navigate([redirectUrl]);
    }
    else {
      this.errorMessage = authResult.error;
      this.loginErrorRetryPayload = authResult.errorRetryPayload;
    }
  }

  logout() {
    return this.af.logout();
  }

  private getLoginFunctionForProvider(provider: AuthProviders) {
    switch (provider) {
      case AuthProviders.facebook:
        return () => this.af.loginWithFacebook(this.loginErrorRetryPayload);
      case AuthProviders.google:
        return () => this.af.loginWithGoogle(this.loginErrorRetryPayload);
      default:
        throw new Error(`Provider "${provider}" is not supported.`);
    }
  }

}
