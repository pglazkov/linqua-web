import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

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
  host: {
    '[class.learned]': 'isLearned()',
  },
})
export class EntryItemComponent {
  readonly originalText = input.required<string>();
  readonly translation = input.required<string>();
  readonly isLearned = input.required<boolean>();

  readonly editRequest = output();
  readonly deleteRequest = output();
  readonly toggleIsLearnedRequest = output();

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
