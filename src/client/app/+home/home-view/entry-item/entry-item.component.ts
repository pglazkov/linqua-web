import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EntryViewModel } from '../entry.vm';

@Component({
  selector: 'app-entry-item',
  templateUrl: './entry-item.component.html',
  styleUrls: ['./entry-item.component.scss']
})
export class EntryItemComponent implements OnInit {
  @Input() entry: EntryViewModel;

  @Output() editRequest = new EventEmitter();
  @Output() deleteRequest = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  edit() {
    this.editRequest.emit();
  }

  delete() {
    this.deleteRequest.emit();
  }
}
