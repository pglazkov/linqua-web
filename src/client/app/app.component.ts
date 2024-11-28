import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatToolbar } from '@angular/material/toolbar';
import { first, firstValueFrom } from 'rxjs';

import { AboutDialogComponent } from './about-dialog/about-dialog.component';
import { AuthResult, AuthService } from './auth';
import { LoginComponent } from './auth/login.component';
import { EntryListComponent } from './entry-list';
import { EntryStorageService } from './storage';

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
    EntryListComponent,
    MatProgressSpinner,
    LoginComponent,
    AsyncPipe,
  ],
})
export class AppComponent implements OnInit {
  private readonly af = inject(AuthService);
  private readonly entryStorageService = inject(EntryStorageService);
  private readonly dialog = inject(MatDialog);

  states = States;

  state: States = States.Unknown;

  redirectAuthResult: AuthResult | undefined;

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
