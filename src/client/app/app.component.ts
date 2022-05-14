import { Component, OnInit } from '@angular/core';
import { AuthResult, AuthService, EntryStorageService } from 'shared';
import { firstValueFrom, first } from 'rxjs';

export enum States {
  Unknown,
  LoginNeeded,
  HandleLoginRedirect,
  LoggedIn
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  states = States;

  state: States = States.Unknown;

  redirectAuthResult: AuthResult | undefined;

  constructor(private af: AuthService, private entryStorageService: EntryStorageService) {
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

  get stats$() {
    return this.entryStorageService.stats$;
  }

  logout() {
    return this.af.logout().then(r => {
      window.location.reload();
      return r;
    });
  }

  onLoginSuccess() {
    this.state = States.LoggedIn;
  }

  private async initState(): Promise<void> {
    this.state = States.Unknown;

    if (this.af.shouldHandleRedirectResult) {
      this.state = States.HandleLoginRedirect;

      this.redirectAuthResult = await this.af.handleRedirectResult();
    }

    const isLoggedIn = await firstValueFrom(this.af.isLoggedIn.pipe(first()));

    if (!isLoggedIn) {
      this.state = States.LoginNeeded;
    }
    else {
      this.state = States.LoggedIn;
    }
  }
}

