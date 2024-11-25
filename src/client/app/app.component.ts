import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatToolbar } from '@angular/material/toolbar';
import { AuthResult, AuthService, EntryStorageService } from '@linqua/shared';
import { first, firstValueFrom } from 'rxjs';

import { AboutDialogComponent } from './about-dialog/about-dialog.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './shared/auth/login/login.component';

export enum States {
  Unknown,
  LoginNeeded,
  HandleLoginRedirect,
  LoggedIn,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    MatToolbar,
    MatIcon,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    HomeComponent,
    MatProgressSpinner,
    LoginComponent,
    AsyncPipe,
  ],
})
export class AppComponent implements OnInit {
  states = States;

  state: States = States.Unknown;

  redirectAuthResult: AuthResult | undefined;

  constructor(
    private af: AuthService,
    private entryStorageService: EntryStorageService,
    private dialog: MatDialog,
  ) {}

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
    } else {
      this.state = States.LoggedIn;
    }
  }
}
