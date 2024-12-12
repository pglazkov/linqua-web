import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

export enum UserLoginState {
  Unknown,
  LoginNeeded,
  HandleLoginRedirect,
  LoggedIn,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly af = inject(AuthService);
  private readonly entryStorageService = inject(EntryStorageService);
  private readonly dialog = inject(MatDialog);

  protected readonly UserLoginState = UserLoginState;

  protected readonly userLoginState = signal(UserLoginState.Unknown);
  protected readonly redirectAuthResult = signal<AuthResult | undefined>(undefined);
  protected readonly isLoggedIn = toSignal(this.af.isLoggedIn$);
  protected readonly stats = toSignal(this.entryStorageService.stats$);
  protected readonly user = toSignal(this.af.user$);

  async ngOnInit() {
    if (this.af.shouldHandleRedirectResult) {
      this.userLoginState.set(UserLoginState.HandleLoginRedirect);

      this.redirectAuthResult.set(await this.af.handleRedirectResult());
    }

    const isLoggedIn = await firstValueFrom(this.af.isLoggedIn$.pipe(first()));

    if (!isLoggedIn) {
      this.userLoginState.set(UserLoginState.LoginNeeded);
    } else {
      this.userLoginState.set(UserLoginState.LoggedIn);
    }
  }

  protected async logout() {
    await this.af.logout();
    window.location.reload();
  }

  protected onLoginSuccess() {
    this.userLoginState.set(UserLoginState.LoggedIn);
  }

  protected onLogoClick() {
    this.dialog.open(AboutDialogComponent);
  }
}
