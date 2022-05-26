import { Component, OnInit } from '@angular/core';
import { AuthResult, AuthService, EntryStorageService } from 'shared';
import { firstValueFrom, first } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';

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

  constructor(private af: AuthService, private entryStorageService: EntryStorageService, private dialog: MatDialog) {
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

  onLogoClick() {
    this.dialog.open(AboutDialogComponent);
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

