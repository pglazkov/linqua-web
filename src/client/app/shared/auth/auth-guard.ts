import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {

  }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const url: string = state.url;

    return this.checkLogin(url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(route, state);
  }

  checkLogin(url: string): Observable<boolean> {
    return this.authService.isLoggedIn.map(isLoggedIn => {
      if (isLoggedIn) { 
        return true; 
      }

      // Navigate to the login page with extras
      this.router.navigate(['/login'], { queryParams: { redirectUrl: url }});
      return false;
    });    
  }
}
