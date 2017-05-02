import { Component, OnInit } from '@angular/core';
import { AuthMethods, AuthProviders } from 'angularfire2';
import { AuthService } from 'shared';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-view',
  templateUrl: './login-view.component.html',
  styleUrls: ['./login-view.component.scss']
})
export class LoginViewComponent implements OnInit {

  providers = AuthProviders;

  constructor(public af: AuthService, private router: Router) { }

  ngOnInit() {
  }

  getIsLoggedIn() {
    return this.af.isLoggedIn;
  }

  getUser() {
    return this.af.loggedInUser;
  }

  async login(provider: AuthProviders) {
    const success = await this.af.login(provider, AuthMethods.Popup);

    if (success) {
      this.router.navigate([this.af.redirectUrl]);
    }
  }

  logout() {
    return this.af.logout();
  }

}
