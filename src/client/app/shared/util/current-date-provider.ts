import { Injectable } from "@angular/core";

@Injectable({ 
  providedIn: 'root'
})
export class CurrentDateProvider {
  getCurrentDate(): Date {
    return new Date();
  }
}