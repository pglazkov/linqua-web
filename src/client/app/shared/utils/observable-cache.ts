import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

export class ObservableCache<T> {
  private cachedValueSubject: ReplaySubject<T> | undefined;
  private underlyingSubscription: Subscription;
  private invalidateEventSubscription: Subscription;

  constructor(private observableGetter: () => Observable<T>, invalidateEvent?: Observable<any>) {
    if (invalidateEvent) {
      this.invalidateEventSubscription = invalidateEvent.subscribe(() => this.invalidate());
    }
  }

  get(): Observable<T> {
    if (!this.cachedValueSubject) {
      this.cachedValueSubject = new ReplaySubject<T>();
      
      this.underlyingSubscription = this.observableGetter().take(1).subscribe(this.cachedValueSubject);
    }

    return this.cachedValueSubject;
  }

  invalidate() {    
    this.cachedValueSubject = undefined;
  }

  dispose() {
    if (this.underlyingSubscription) {
      this.underlyingSubscription.unsubscribe();
    }

    if (this.invalidateEventSubscription) {
      this.invalidateEventSubscription.unsubscribe();
    }
  }
}
