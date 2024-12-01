import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { AuthResult, AuthService } from './auth.service';

const demoAccount = {
  email: 'demo@linqua-app.com',
  password: 'p@ssw0rd',
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    MatCard,
    MatCardContent,
    MatButton,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
    MatCardActions,
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly af = inject(AuthService);

  readonly loginSuccess = output();
  readonly redirectAuthResult = input<AuthResult | undefined>();

  protected readonly loginForm = new FormGroup({
    userName: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  protected readonly isLoggingIn = signal(false);
  protected readonly errorMessage = signal<string | undefined>(undefined);

  protected getUserNameError(): string {
    const userName = this.loginForm.controls.userName;

    return userName.hasError('required')
      ? 'Please enter the email address of the user'
      : userName.hasError('email')
        ? 'This does not look like a valid email'
        : '';
  }

  protected loginWithFacebook(): void {
    this.af.loginWithFacebook();
  }

  protected loginWithGoogle(): void {
    this.af.loginWithGoogle();
  }

  protected loginWithDemoAccount(): Promise<void> {
    return this.loginWithEmailAndPassword(demoAccount.email, demoAccount.password);
  }

  protected async onLoginFormSubmit(): Promise<void> {
    if (!this.loginForm.valid) {
      return;
    }

    await this.loginWithEmailAndPassword(this.loginForm.value.userName!, this.loginForm.value.password!);
  }

  private async loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    this.isLoggingIn.set(true);

    try {
      await this.af.loginWithEmailAndPassword(email, password);
      this.loginSuccess.emit();
    } catch (error: any) {
      this.errorMessage.set(error);
    } finally {
      this.isLoggingIn.set(false);
    }
  }
}
