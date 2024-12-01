import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { Entry } from '../../model';

@Component({
  selector: 'app-random-entry',
  templateUrl: './random-entry.component.html',
  styleUrls: ['./random-entry.component.scss'],
  animations: [
    trigger('entryChange', [
      transition('* => *', [
        animate(
          '0.3s ease-in-out',
          keyframes([
            style({ opacity: 0, offset: 0 }),
            style({ opacity: 0, offset: 0.3 }),
            style({ opacity: 1, offset: 1.0 }),
          ]),
        ),
      ]),
    ]),
  ],
  imports: [MatCard, MatCardContent, MatIconButton, MatIcon, MatProgressSpinner, MatMenuTrigger, MatMenu, MatMenuItem],
})
export class RandomEntryComponent {
  @Input()
  get entry(): Entry | undefined {
    return this._entry;
  }
  set entry(value: Entry | undefined) {
    this._entry = value;
    this.nextRequested = false;
  }

  @Output() nextEntryRequest = new EventEmitter<void>();
  @Output() editRequest = new EventEmitter();
  @Output() deleteRequest = new EventEmitter();
  @Output() markLearnedRequest = new EventEmitter();

  private _entry: Entry | undefined;

  nextRequested = false;

  requestNext() {
    this.nextRequested = true;
    this.nextEntryRequest.emit();
  }

  edit() {
    this.editRequest.emit();
  }

  delete() {
    this.deleteRequest.emit();
  }

  markLearned() {
    this.nextRequested = true;
    this.markLearnedRequest.emit();
  }
}
