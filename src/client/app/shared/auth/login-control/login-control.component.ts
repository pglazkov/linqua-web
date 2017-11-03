import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthResult } from 'shared';

const demoAccount = {
  email: 'demo@linqua-app.com',
  password: 'p@ssw0rd'
};

@Component({
  selector: 'app-login-control',
  templateUrl: './login-control.component.html',
  styleUrls: ['./login-control.component.scss']
})
export class LoginControlComponent {

  @Output() loginSuccess = new EventEmitter<void>();

  @Input() redirectAuthResult: AuthResult | undefined;

  loginForm: FormGroup;
  userNameControl: FormControl;

  isLoggingIn = false;
  errorMessage: string | undefined;

  constructor(public af: AuthService, private fb: FormBuilder) {
    this.userNameControl = new FormControl('', [Validators.required, Validators.email]);
    this.loginForm = fb.group({
      userName: this.userNameControl,
      password: ['', Validators.required]
    });
  }

  getUserNameError() {
    return this.userNameControl.hasError('required') ? 'Please enter the email address of the user' :
      this.userNameControl.hasError('email') ? 'This does not look like a valid email' : '';
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

    await this.loginWithEmailAndPassword(this.loginForm.value.userName, this.loginForm.value.password);
  }

  private async loginWithEmailAndPassword(email: string, password: string) {
    this.isLoggingIn = true;

    try {
      await this.af.loginWithEmailAndPassword(email, password);
      this.loginSuccess.emit();
    }
    catch (error) {
      this.errorMessage = error;
    }
    finally {
      this.isLoggingIn = false;
    }
  }
}
