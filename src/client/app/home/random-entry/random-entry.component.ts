import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Entry } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';

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
  ]
})
export class RandomEntryComponent implements OnInit {
  @Input()
  get entry(): Entry | undefined {
    return this._entry;
  }
  set entry(value: Entry | undefined) {
    this._entry = value;
    this.nextRequested = false;
  }

  @Output() nextEntryRequest = new EventEmitter<void>();

  private _entry: Entry | undefined;

  nextRequested = false;

  constructor() { }

  ngOnInit() {
  }

  requestNext() {
    this.nextRequested = true;
    this.nextEntryRequest.emit();
  }
}
