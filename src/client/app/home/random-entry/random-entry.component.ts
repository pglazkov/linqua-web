import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Entry } from 'shared';

@Component({
  selector: 'app-random-entry',
  templateUrl: './random-entry.component.html',
  styleUrls: ['./random-entry.component.scss']
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
