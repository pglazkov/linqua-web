import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login-control',
  templateUrl: './login-control.component.html',
  styleUrls: ['./login-control.component.scss']
})
export class LoginControlComponent {

  constructor(public af: AuthService) {
  }

  loginWithFacebook() {
    this.af.loginWithFacebook();
  }

  loginWithGoogle() {
    this.af.loginWithGoogle();
  }
}
