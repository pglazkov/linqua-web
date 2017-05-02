import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { AuthService } from './shared/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { AuthProviders, AuthMethods, FirebaseAuthState } from 'angularfire2';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: AuthService, useClass: FakeAuthService }
      ]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'app works!'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app works!');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('app works!');
  }));
});

export class FakeAuthService {
  get authState(): Observable<FirebaseAuthState> {
    return Observable.of({
      uid: 'test',
      provider: AuthProviders.Facebook,
      auth: {
        displayName : 'test',
        email : 'test@t.com',
        // tslint:disable-next-line:no-null-keyword
        photoURL : null,
        providerId : 'facebook',
        uid : 'test'
      }
    });
  }

  login(provider: AuthProviders, method: AuthMethods): Promise<boolean> {
    return Promise.resolve(true);
  }
}
