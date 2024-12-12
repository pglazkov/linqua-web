import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RandomEntryComponent {
  readonly entry = input.required<Entry | undefined>();
  readonly isLoading = input.required<boolean>();

  readonly nextEntryRequest = output();
  readonly editRequest = output();
  readonly deleteRequest = output();
  readonly markLearnedRequest = output();

  protected requestNext() {
    this.nextEntryRequest.emit();
  }

  protected edit() {
    this.editRequest.emit();
  }

  protected delete() {
    this.deleteRequest.emit();
  }

  protected markLearned() {
    this.markLearnedRequest.emit();
  }
}
