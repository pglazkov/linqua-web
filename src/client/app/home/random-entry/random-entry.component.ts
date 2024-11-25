import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '@linqua/shared';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';

@Component({
    selector: 'app-random-entry',
    templateUrl: './random-entry.component.html',
    styleUrls: ['./random-entry.component.scss'],
    animations: [
        trigger('entryChange', [
            transition('* => *', [
                animate('0.3s ease-in-out', keyframes([
                    style({ opacity: 0, offset: 0 }),
                    style({ opacity: 0, offset: 0.3 }),
                    style({ opacity: 1, offset: 1.0 })
                ]))
            ])
        ])
    ],
    standalone: true,
    imports: [MatCard, MatCardContent, NgIf, MatIconButton, MatIcon, MatProgressSpinner, MatMenuTrigger, MatMenu, MatMenuItem]
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
