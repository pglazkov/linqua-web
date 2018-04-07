import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { first, map, switchMap } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
import { FirebaseApp } from 'ng-firebase-lite';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(private fba: FirebaseApp) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.fba.auth().currentUser;

    if (user) {
      return from(user.getIdToken()).pipe(
        first(),
        map(token => {
          if (token) {
            return request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
          }

          return request;
        }),
        switchMap(req => {
          return next.handle(req);
        })
      );
    }

    return next.handle(request);
  }
}
