import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
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
  standalone: true,
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
  ],
})
export class LoginComponent {
  private readonly af = inject(AuthService);

  @Output() loginSuccess = new EventEmitter<void>();

  @Input() redirectAuthResult: AuthResult | undefined;

  loginForm = new FormGroup({
    userName: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  isLoggingIn = false;
  errorMessage: string | undefined;

  getUserNameError() {
    const userName = this.loginForm.controls.userName;

    return userName.hasError('required')
      ? 'Please enter the email address of the user'
      : userName.hasError('email')
        ? 'This does not look like a valid email'
        : '';
  }

  loginWithFacebook() {
    this.af.loginWithFacebook();
  }

  loginWithGoogle() {
    this.af.loginWithGoogle();
  }

  async loginWithDemoAccount() {
    await this.loginWithEmailAndPassword(demoAccount.email, demoAccount.password);
  }

  async onLoginFormSubmit() {
    if (!this.loginForm.valid) {
      return;
    }

    await this.loginWithEmailAndPassword(this.loginForm.value.userName!, this.loginForm.value.password!);
  }

  private async loginWithEmailAndPassword(email: string, password: string) {
    this.isLoggingIn = true;

    try {
      await this.af.loginWithEmailAndPassword(email, password);
      this.loginSuccess.emit();
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.isLoggingIn = false;
    }
  }
}
