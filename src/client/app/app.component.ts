import { Component, OnInit } from '@angular/core';
import { AuthService } from 'shared';

export enum States {
  Unknown,
  LoginNeeded,
  HandleLoginRedirect,
  LoginError,
  LoggedIn
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  errorMessage: string | undefined;

  states = States;

  state: States = States.Unknown;

  constructor(private af: AuthService) {
  }

  async ngOnInit() {
    await this.initState();
  }

  get user() {
    return this.af.user;
  }

  get isLoggedIn() {
    return this.af.isLoggedIn;
  }

  logout() {
    return this.af.logout().then(r => {
      window.location.reload();
      return r;
    });
  }

  private async initState(): Promise<void> {
    this.state = States.Unknown;

    this.state = States.HandleLoginRedirect;

    const authResult = await this.af.handleLoginResultIfNeeded();

    if (authResult && !authResult.success) {
      this.errorMessage = authResult.error;

      this.state = States.LoginError;
      return;
    }

    const isLoggedIn = await this.af.isLoggedIn.toPromise();

    if (!isLoggedIn) {
      this.state = States.LoginNeeded;
    }
    else {
      this.state = States.LoggedIn;
    }
  }
}

