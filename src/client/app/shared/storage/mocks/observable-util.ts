import { Observable } from 'rxjs/Observable';
import { concatMap } from 'rxjs/operators';
import { of as observableOf } from 'rxjs/observable/of';

export class ObservableUtil {
  static getChildData(obj: any, path: string): Observable<any> {
    return ObservableUtil.isObservable(obj) ? obj.pipe(concatMap(d => {
      const result = d ? this.getChildData(d, path) : d;

      if (result && ObservableUtil.isObservable(result)) {
        return result;
      }

      return observableOf(result);
    })) : obj[path];
  }

  static isObservable(obj: any): obj is Observable<any> {
    return !!obj.subscribe;
  }
}
