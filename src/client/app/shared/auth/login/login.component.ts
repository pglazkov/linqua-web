import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthResult } from '@linqua/shared';

const demoAccount = {
  email: 'demo@linqua-app.com',
  password: 'p@ssw0rd'
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  @Output() loginSuccess = new EventEmitter<void>();

  @Input() redirectAuthResult: AuthResult | undefined;

  loginForm = new FormGroup({
    userName: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  isLoggingIn = false;
  errorMessage: string | undefined;

  constructor(public af: AuthService) {
  }

  getUserNameError() {
    const userName = this.loginForm.controls.userName;

    return userName.hasError('required') ? 'Please enter the email address of the user' :
      userName.hasError('email') ? 'This does not look like a valid email' : '';
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
    }
    catch (error: any) {
      this.errorMessage = error;
    }
    finally {
      this.isLoggingIn = false;
    }
  }
}
