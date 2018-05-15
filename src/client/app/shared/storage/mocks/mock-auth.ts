import * as firebase from 'firebase';
import { Observable } from 'rxjs/Observable';

export class MockAuth {
  constructor(private loggedInUser: Observable<firebase.UserInfo>) {
    loggedInUser.subscribe(u => {
      this.currentUser = u as any;
    });
  }

  currentUser: firebase.User | null;

  onAuthStateChanged(nextOrObserver: firebase.Observer<any, any> | ((a: (firebase.User | null)) => any),
                     error?: (a: firebase.auth.Error) => any,
                     completed?: firebase.Unsubscribe): firebase.Unsubscribe {
    let sub: any;

    if (typeof nextOrObserver === 'function') {
      sub = this.loggedInUser.subscribe((user) => nextOrObserver(user as firebase.User));
    }
    else {
      sub = this.loggedInUser.subscribe(nextOrObserver);
    }

    return () => {
      sub.unsubscribe();
    };
  }
}
