import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { EntryListItemViewModel } from '../entry-list-item.vm';

@Component({
  selector: 'app-entry-item',
  templateUrl: './entry-item.component.html',
  styleUrls: ['./entry-item.component.scss']
})
export class EntryItemComponent implements OnInit {
  @Input() entry: EntryListItemViewModel;

  @Output() editRequest = new EventEmitter();
  @Output() deleteRequest = new EventEmitter();
  @Output() toggleIsLearnedRequest = new EventEmitter();

  @HostBinding('class.learned')
  get isLearned(): boolean {
    return this.entry.isLearned;
  }

  constructor() { }

  ngOnInit() {
  }

  edit() {
    this.editRequest.emit();
  }

  delete() {
    this.deleteRequest.emit();
  }

  toggleIsLearned() {
    this.toggleIsLearnedRequest.emit();
  }
}
