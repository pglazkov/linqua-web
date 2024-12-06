import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem, MatListSubheaderCssMatStyler } from '@angular/material/list';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { filter, first, firstValueFrom, map, Subject, take, Unsubscribable } from 'rxjs';

import { EntryEditorDialogComponent, EntryEditorDialogData } from '../entry-editor-dialog';
import { Entry } from '../model';
import { EntryStorageService } from '../storage';
import { EntryItemComponent } from './entry-item/entry-item.component';
import { EntryStore } from './entry-list.state';
import { EntryListItemViewModel } from './entry-list-item.vm';
import { RandomEntryComponent } from './random-entry/random-entry.component';
import { RandomEntryService } from './random-entry/random-entry.service';

const entryDeletionAnimationDuration = 200;

interface EntryListRawData {
  loadedEntries: Entry[];
  canLoadMore: boolean;
  loadMoreToken: unknown;
}

@Component({
  selector: 'app-entry-list',
  templateUrl: './entry-list.component.html',
  styleUrls: ['./entry-list.component.scss'],
  animations: [
    trigger('entryCardEnterLeave', [
      state('in', style({ opacity: 1, height: '*' })),
      transition('void => new', [
        animate(
          '0.4s',
          keyframes([
            style({ opacity: 0, height: 0, offset: 0 }),
            style({ opacity: 0, height: '*', offset: 0.3 }),
            style({ opacity: 1, height: '*', offset: 1.0 }),
          ]),
        ),
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
    AsyncPipe,
  ],
  providers: [EntryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryListComponent implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly storage = inject(EntryStorageService);
  private readonly randomEntryService = inject(RandomEntryService);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly cd = inject(ChangeDetectorRef);

  private readonly entryListState = inject(EntryStore);

  protected readonly isLoaded = this.entryListState.isLoaded;
  protected readonly timeGroups = this.entryListState.timeGroups;
  protected readonly canLoadMore = signal(false);
  protected readonly loadMoreToken = signal<unknown>(undefined);
  protected readonly isLoadingMore = signal(false);
  protected readonly isLoadingRandomEntry = signal(false);
  protected readonly randomEntry = signal<Entry | undefined>(undefined);

  protected readonly listElement = viewChild('list', { read: ElementRef });

  private readonly ngUnsubscribe: Unsubscribable[] = [];

  private readonly dataSubject = new Subject<EntryListRawData>();

  private loadedEntries: Entry[] = [];

  constructor() {
    this.dataSubject.subscribe(s => this.onDataChanges(s));
  }

  ngOnInit() {
    this.loadRandomEntry();
    this.loadEntryList();
  }

  get stats$() {
    return this.storage.stats$;
  }

  async loadMore() {
    this.isLoadingMore.set(true);

    try {
      const result = await firstValueFrom(
        this.storage.getEntriesStream(this.loadMoreToken).pipe(
          filter(r => !r.fromCache),
          first(),
        ),
      );

      this.dataSubject.next({
        loadedEntries: this.loadedEntries.concat(result.entries),
        canLoadMore: result.hasMore,
        loadMoreToken: result.loadMoreToken,
      });
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  ngOnDestroy(): void {
    for (const sub of this.ngUnsubscribe) {
      sub.unsubscribe();
    }
  }

  async addNewEntry() {
    const result: Entry = await firstValueFrom(
      this.dialog.open(EntryEditorDialogComponent, this.createEntryDialogConfig()).afterClosed().pipe(first()),
    );

    if (result) {
      result.id = this.storage.getNewId();

      const entryVm = new EntryListItemViewModel(result);

      entryVm.isNew.set(true);

      this.loadedEntries.unshift(entryVm.model);

      this.entryListState.addEntry(result);

      const listElement = this.listElement();
      if (listElement) {
        listElement.nativeElement.scrollTop = 0;
      }

      await this.storage.addOrUpdate(entryVm.model);
    }
  }

  async onEditRequested(entry: Entry) {
    const editorDialog = this.dialog.open(EntryEditorDialogComponent, this.createEntryDialogConfig({ entry }));

    const result: Entry = await firstValueFrom(editorDialog.afterClosed().pipe(first()));

    if (result) {
      result.updatedOn = new Date();

      if (this.randomEntry()?.id === entry.id) {
        this.randomEntry.set(result);
      }

      this.entryListState.updateEntry(result);

      await this.storage.addOrUpdate(result);
      await this.randomEntryService.onEntryUpdated(result);
    }
  }

  async onDeleteRequested(entry: Entry) {
    const entryIndex = this.loadedEntries.findIndex(x => x.id === entry.id);

    if (entryIndex >= 0) {
      this.loadedEntries.splice(entryIndex, 1);
    }

    this.entryListState.deleteEntry(entry.id);
    // setTimeout(() => {
    //   this.entryListState.deleteEmptyGroups();
    // }, entryDeletionAnimationDuration);

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

    await this.onToggleIsLearnedRequested(entry);
  }

  async onToggleIsLearnedRequested(entry: Entry) {
    const newIsLearned = this.entryListState.toggleIsLearned(entry.id);

    if (newIsLearned) {
      await this.storage.archive(entry.id);
      await this.randomEntryService.onEntryDeleted(entry);
    } else {
      await this.storage.unarchive(entry.id);
    }

    if (!this.randomEntry() || this.randomEntry()!.id === entry.id) {
      await this.loadRandomEntry();
    }

    this.cd.markForCheck();
  }

  get emptyListInfo$() {
    return this.stats$.pipe(
      map(s => {
        if (!s || !s.totalEntryCount) {
          return {
            mainMessage: 'It is lonely here...',
            extendedMessage: 'Start by adding a word or phrase in a foreign language that you would like to learn.',
          };
        }

        return {
          mainMessage: 'All done',
          extendedMessage: 'Congratulations!',
        };
      }),
      take(1),
    );
  }

  private loadEntryList() {
    let sub: Unsubscribable = {
      unsubscribe: () => {},
    };

    sub = this.storage.getEntriesStream().subscribe(result => {
      this.dataSubject.next({
        loadedEntries: result.entries,
        canLoadMore: result.hasMore,
        loadMoreToken: result.loadMoreToken,
      });

      if (!result.fromCache) {
        sub.unsubscribe();
      }
    });

    this.ngUnsubscribe.push(sub);
  }

  private onDataChanges(newData: EntryListRawData) {
    this.entryListState.setEntries(newData.loadedEntries);

    this.loadedEntries = newData.loadedEntries;
    this.canLoadMore.set(newData.canLoadMore);
    this.loadMoreToken.set(newData.loadMoreToken);
  }

  private createEntryDialogConfig(config: { entry?: Entry } = {}): MatDialogConfig {
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
      const getRandomEntry = () => firstValueFrom(this.randomEntryService.getRandomEntry());

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

  protected markAsNotNew(entry: Entry) {
    this.entryListState.setIsNew(entry.id, false);
  }
}
