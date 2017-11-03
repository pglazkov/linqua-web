import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-control',
  templateUrl: './login-control.component.html',
  styleUrls: ['./login-control.component.scss']
})
export class LoginControlComponent {

  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginFailure = new EventEmitter<any>();

  loginForm: FormGroup;

  isLoggingIn = false;
  errorMessage: string | undefined;

  constructor(public af: AuthService, private fb: FormBuilder) {
    this.loginForm = fb.group({
      userName: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  loginWithFacebook() {
    this.af.loginWithFacebook();
  }

  loginWithGoogle() {
    this.af.loginWithGoogle();
  }

  async onLoginFormSubmit() {
    if (!this.loginForm.valid) {
      return;
    }

    this.isLoggingIn = true;

    try {
      await this.af.loginWithEmailAndPassword(this.loginForm.value.userName, this.loginForm.value.password);
      this.loginSuccess.emit();
    }
    catch (error) {
      this.errorMessage = error;
      this.loginFailure.emit(error);
    }
    finally {
      this.isLoggingIn = false;
    }
  }
}
