import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { firebaseAppToken } from 'ng-firebase-lite';
import { first, from, map, Observable, switchMap } from 'rxjs';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  auth: Auth;

  constructor(@Inject(firebaseAppToken) fba: FirebaseApp) {
    this.auth = getAuth(fba);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.auth.currentUser;

    if (user) {
      return from(user.getIdToken()).pipe(
        first(),
        map(token => {
          if (token) {
            return request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            });
          }

          return request;
        }),
        switchMap(req => {
          return next.handle(req);
        }),
      );
    }

    return next.handle(request);
  }
}
