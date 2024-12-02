import { ChangeDetectionStrategy, Component, HostBinding, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryItemComponent {
  readonly entry = input.required<EntryListItemViewModel>();

  readonly editRequest = output();
  readonly deleteRequest = output();
  readonly toggleIsLearnedRequest = output();

  @HostBinding('class.learned')
  protected get isLearned(): boolean {
    return this.entry().isLearned();
  }

  protected edit() {
    this.editRequest.emit();
  }

  protected delete() {
    this.deleteRequest.emit();
  }

  protected toggleIsLearned() {
    this.toggleIsLearnedRequest.emit();
  }
}
