import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, from, map, Observable, switchMap } from 'rxjs';

import { firebaseAuthToken } from '../firebase';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private readonly auth = inject(firebaseAuthToken);

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
