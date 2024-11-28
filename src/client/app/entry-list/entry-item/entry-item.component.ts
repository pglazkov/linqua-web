import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

import { EntryListItemViewModel } from '../entry-list-item.vm';

@Component({
  selector: 'app-entry-item',
  templateUrl: './entry-item.component.html',
  styleUrls: ['./entry-item.component.scss'],
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatListItemTitle,
    MatListItemLine,
    MatIconButton,
    MatIcon,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
  ],
})
export class EntryItemComponent {
  @Input() entry!: EntryListItemViewModel;

  @Output() editRequest = new EventEmitter();
  @Output() deleteRequest = new EventEmitter();
  @Output() toggleIsLearnedRequest = new EventEmitter();

  @HostBinding('class.learned')
  get isLearned(): boolean {
    return this.entry.isLearned;
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
