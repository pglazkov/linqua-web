import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem, MatListSubheaderCssMatStyler } from '@angular/material/list';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { filter, first, firstValueFrom, takeWhile } from 'rxjs';

import { EntryEditorDialogComponent, EntryEditorDialogData } from '../entry-editor-dialog';
import { Entry } from '../model';
import { EntryStorageService } from '../storage';
import { createEntry } from '../util/create-entry';
import { EntryItemComponent } from './entry-item/entry-item.component';
import { EntryListState } from './entry-list.state';
import { RandomEntryComponent } from './random-entry/random-entry.component';
import { RandomEntryService } from './random-entry/random-entry.service';

@Component({
  selector: 'app-entry-list',
  templateUrl: './entry-list.component.html',
  styleUrls: ['./entry-list.component.scss'],
  animations: [
    trigger('entryCardEnterLeave', [
      state('in', style({ opacity: 1 })),
      transition('void => new', [
        animate('0.2s', keyframes([style({ opacity: 0, offset: 0 }), style({ opacity: 1, offset: 1.0 })])),
      ]),
      transition('* => void', [animate('0.2s ease-in', style({ transform: 'translateX(100%)' }))]),
    ]),
  ],
  imports: [
    MatList,
    RandomEntryComponent,
    MatListSubheaderCssMatStyler,
    MatDivider,
    MatListItem,
    EntryItemComponent,
    MatButton,
    MatProgressSpinner,
    MatFabButton,
    MatIcon,
  ],
  providers: [EntryListState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryListComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly storage = inject(EntryStorageService);
  private readonly randomEntryService = inject(RandomEntryService);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly entryListState = inject(EntryListState);

  protected readonly timeGroups = this.entryListState.timeGroups;
  protected readonly canLoadMore = signal(false);
  protected readonly loadMoreToken = signal<unknown>(undefined);
  protected readonly isInitialListLoaded = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly isLoadingRandomEntry = signal(false);
  protected readonly randomEntry = signal<Entry | undefined>(undefined);
  protected readonly stats = toSignal(this.storage.stats$);

  protected readonly listElement = viewChild('list', { read: ElementRef });

  ngOnInit() {
    this.loadRandomEntry();
    this.loadEntryList();
  }

  private loadEntryList() {
    this.storage
      .getEntriesStream()
      .pipe(
        takeWhile(r => r.fromCache, true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        this.entryListState.setEntries(result.entries);
        this.canLoadMore.set(result.hasMore);
        this.loadMoreToken.set(result.loadMoreToken);
        this.isInitialListLoaded.set(true);
      });
  }

  async loadMore() {
    this.isLoadingMore.set(true);

    try {
      const result = await firstValueFrom(
        this.storage.getEntriesStream(this.loadMoreToken()).pipe(
          filter(r => !r.fromCache),
          first(),
        ),
      );

      this.entryListState.setEntries(result.entries);
      this.canLoadMore.set(result.hasMore);
      this.loadMoreToken.set(result.loadMoreToken);
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  async addNewEntry() {
    const dialogConfig = this.createEntryDialogConfig({
      entry: createEntry({ id: this.storage.getNewId() }),
    });

    const result: Entry = await firstValueFrom(
      this.dialog.open(EntryEditorDialogComponent, dialogConfig).afterClosed().pipe(first()),
    );

    if (result) {
      this.entryListState.addEntry(result);

      const listElement = this.listElement();
      if (listElement) {
        listElement.nativeElement.scrollTop = 0;
      }

      await this.storage.addOrUpdate(result);
    }
  }

  async onEditRequested(entry: Entry) {
    const editorDialog = this.dialog.open(EntryEditorDialogComponent, this.createEntryDialogConfig({ entry }));

    let result: Entry = await firstValueFrom(editorDialog.afterClosed().pipe(first()));

    if (result) {
      result = { ...result, updatedOn: new Date() };

      if (this.randomEntry()?.id === entry.id) {
        this.randomEntry.set(result);
      }

      this.entryListState.updateEntry(result);

      await this.storage.addOrUpdate(result);
      await this.randomEntryService.onEntryUpdated(result);
    }
  }

  async onDeleteRequested(entry: Entry) {
    this.entryListState.deleteEntry(entry.id);

    await this.storage.delete(entry.id);
    await this.randomEntryService.onEntryDeleted(entry);

    if (this.randomEntry()?.id === entry.id) {
      await this.loadRandomEntry();
    }
  }

  onUpdateRandomEntryRequested() {
    return this.loadRandomEntry();
  }

  onEditRandomEntryRequested(entry: Entry) {
    return this.onEditRequested(entry);
  }

  async onMarkLearnedRandomEntryRequested(entry: Entry) {
    this.isLoadingRandomEntry.set(true);

    if (this.entryListState.hasEntry(entry.id)) {
      this.entryListState.toggleIsLearned(entry.id);
    }

    await this.updateIsLearned(entry, true);
  }

  async onToggleIsLearnedRequested(entry: Entry) {
    const newIsLearned = this.entryListState.toggleIsLearned(entry.id);

    await this.updateIsLearned(entry, newIsLearned);
  }

  private async updateIsLearned(entry: Entry, newIsLearned: boolean) {
    if (newIsLearned) {
      await this.storage.archive(entry.id);
      await this.randomEntryService.onEntryDeleted(entry);
    } else {
      await this.storage.unarchive(entry.id);
    }

    if (!this.randomEntry() || this.randomEntry()!.id === entry.id) {
      await this.loadRandomEntry();
    }
  }

  private createEntryDialogConfig(config: { entry: Entry }): MatDialogConfig {
    const result = {
      viewContainerRef: this.viewContainer,
      data: { entry: config.entry } as EntryEditorDialogData,
    };

    const isEdit = !!config.entry;

    if (!this.isMobile()) {
      if (!isEdit) {
        Object.assign(result, {
          maxWidth: '500px',
          position: { bottom: '74px', right: '74px' },
        });
      }
    } else {
      Object.assign(result, {
        width: '100vw',
        maxWidth: '100vw',
        position: { top: '56px' },
      });
    }

    return result;
  }

  private isMobile() {
    return window.screen.width < 768;
  }

  private async loadRandomEntry() {
    this.isLoadingRandomEntry.set(true);

    try {
      const getRandomEntry = () => this.randomEntryService.getRandomEntry();

      const prevEntry = this.randomEntry();
      let newEntry = await getRandomEntry();

      if (prevEntry && newEntry && prevEntry.id === newEntry.id) {
        // We go the same random entry as previous one, let's try one more time
        newEntry = await getRandomEntry();
      }

      this.randomEntry.set(newEntry);
    } finally {
      this.isLoadingRandomEntry.set(false);
    }
  }

  protected onAddAnimationFinished(entry: Entry) {
    this.entryListState.setEntryAnimationTrigger(entry.id, undefined);
  }
}
