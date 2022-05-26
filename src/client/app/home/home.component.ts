import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry, EntryStorageService, TimeGroupService } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { EntryListItemViewModel } from './entry-list-item.vm';
import { EntryListViewModel } from './entry-list.vm';
import { firstValueFrom, Subject, Unsubscribable, filter, first, map, take } from 'rxjs';
import { RandomEntryService } from './random-entry/random-entry.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { EntryListTimeGroupViewModel } from './entry-list-time-group.vm';

interface EntryListState {
  loadedEntries: Entry[];
  canLoadMore: boolean;
  loadMoreToken: any;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('entryCardEnterLeave', [
      state('in', style({ opacity: 1, height: '*' })),
      transition('void => new', [
        animate('0.4s', keyframes([
          style({ opacity: 0, height: 0, offset: 0 }),
          style({ opacity: 0, height: '*', offset: 0.3 }),
          style({ opacity: 1, height: '*', offset: 1.0 })
        ]))
      ]),
      transition('* => void', [
        animate('0.2s ease-in', style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  listVm: EntryListViewModel | undefined;
  canLoadMore = false;
  loadMoreToken: any;
  isLoadingMore = false;
  isLoadingRandomEntry = false;
  randomEntry: Entry | undefined;

  @ViewChild('list', { read: ElementRef, static: false }) listElement: ElementRef | undefined;

  private readonly ngUnsubscribe: Unsubscribable[] = [];

  private readonly listStateSubject = new Subject<EntryListState>();

  private loadedEntries: Entry[] = [];

  constructor(private dialog: MatDialog,
              private storage: EntryStorageService,
              private randomEntryService: RandomEntryService,
              private viewContainer: ViewContainerRef,
              private timeGroupService: TimeGroupService) {
    this.listStateSubject.subscribe(s => this.onListStateChange(s));
  }

  ngOnInit() {
    this.loadRandomEntry();
    this.loadEntryList();
  }

  get stats$() {
    return this.storage.stats$;
  }

  async loadMore() {
    this.isLoadingMore = true;

    try {
      const result = await firstValueFrom(this.storage.getEntriesStream(this.loadMoreToken).pipe(
        filter(r => !r.fromCache),
        first()
      ));

      this.listStateSubject.next({
        loadedEntries: this.loadedEntries.concat(result.entries),
        canLoadMore: result.hasMore,
        loadMoreToken: result.loadMoreToken
      });
    }
    finally {
      this.isLoadingMore = false;
    }
  }

  ngOnDestroy(): void {
    for (const sub of this.ngUnsubscribe) {
      sub.unsubscribe();
    }
  }

  async addNewEntry() {
    const listVm = this.listVm;

    if (listVm === undefined) {
      return;
    }

    const result: Entry = await firstValueFrom(this.dialog.open(EntryEditorDialogComponent, this.createEntryDialogConfig())
      .afterClosed()
      .pipe(first()));

    if (result) {
      result.id = this.storage.getNewId();

      const entry = new EntryListItemViewModel(result);

      entry.isNew = true;

      this.loadedEntries.unshift(result);
      listVm.addEntry(entry);

      if (this.listElement) {
        this.listElement.nativeElement.scrollTop = 0;
      }

      await this.storage.addOrUpdate(entry.model);
    }
  }

  async onEditRequested(entry: Entry) {
    if (this.listVm === undefined) {
      return;
    }

    const editorDialog = this.dialog.open(EntryEditorDialogComponent, this.createEntryDialogConfig({ isEdit: true }));
    editorDialog.componentInstance.setEntry(entry);

    const result: Entry = await firstValueFrom(editorDialog.afterClosed().pipe(first()));

    if (result) {
      Object.assign(entry, result);
      entry.updatedOn = new Date();

      if (this.randomEntry && this.randomEntry.id === entry.id) {
        this.randomEntry = entry;
      }

      this.listVm.onEntryUpdated(entry);

      await this.storage.addOrUpdate(entry);
      await this.randomEntryService.onEntryUpdated(entry);
    }
  }

  async onDeleteRequested(entry: Entry | EntryListItemViewModel, group?: EntryListTimeGroupViewModel) {
    if (this.listVm === undefined) {
      return;
    }

    const entryModel = entry instanceof EntryListItemViewModel ? entry.model : entry;

    const entryIndex = this.loadedEntries.findIndex(x => x.id === entry.id);

    if (entryIndex >= 0) {
      this.loadedEntries.splice(entryIndex, 1);
    }

    if (entry instanceof EntryListItemViewModel && group) {
      this.listVm.deleteEntry(entry, group);
    }

    await this.storage.delete(entry.id);
    await this.randomEntryService.onEntryDeleted(entryModel);

    if (this.randomEntry && this.randomEntry.id === entry.id) {
      await this.loadRandomEntry();
    }
  }

  async onUpdateRandomEntryRequested() {
    await this.loadRandomEntry();
  }

  async onEditRandomEntryRequested(entry: Entry) {
    await this.onEditRequested(entry);
  }

  async onDeleteRandomEntryRequested(entry: Entry) {
    if (!this.listVm) {
      return;
    }

    const vms = this.listVm.findViewModelsForEntry(entry);

    if (vms) {
      await this.onDeleteRequested(vms.entryVm, vms.entryGroupVm);
    }
    else {
      await this.onDeleteRequested(entry);
    }
  }

  async onMarkLearnedRandomEntryRequested(entry: Entry) {
    if (!this.listVm) {
      return;
    }

    const vms = this.listVm.findViewModelsForEntry(entry);

    await this.onToggleIsLearnedRequested(vms ? vms.entryVm : entry);
  }

  trackByGroup(index: number, group: EntryListTimeGroupViewModel) {
    return group.order;
  }

  trackByEntry(index: number, entry: EntryListItemViewModel) {
    return entry.id;
  }

  async onToggleIsLearnedRequested(entry: EntryListItemViewModel | Entry) {
    const entryModel = entry instanceof EntryListItemViewModel ? entry.model : entry;
    const newIsLearned = entry instanceof EntryListItemViewModel ? !entry.isLearned : true;

    if (entry instanceof EntryListItemViewModel) {
      entry.isLearned = newIsLearned;
    }

    if (newIsLearned) {
      await this.storage.archive(entry.id);
      await this.randomEntryService.onEntryDeleted(entryModel);
    }
    else {
      await this.storage.unarchive(entry.id);
    }

    if (!this.randomEntry || (this.randomEntry && this.randomEntry.id === entry.id)) {
      await this.loadRandomEntry();
    }
  }

  get emptyListInfo$() {
    return this.stats$.pipe(
      map(s => {
        if (!s || !s.totalEntryCount) {
          return {
            mainMessage: 'It is lonely here...',
            extendedMessage: 'Start by adding a word or phrase in a foreign language that you would like to learn.'
          };
        }

        return {
          mainMessage: 'All done',
          extendedMessage: 'Congratulations!'
        };
      }),
      take(1)
    );
  }

  private loadEntryList() {
    let sub: Unsubscribable = {
      unsubscribe: () => {}
    };

    sub = this.storage.getEntriesStream().subscribe(result => {
      this.listStateSubject.next({
        loadedEntries: result.entries,
        canLoadMore: result.hasMore,
        loadMoreToken: result.loadMoreToken
      });

      if (!result.fromCache) {
        sub.unsubscribe();
      }
    });

    this.ngUnsubscribe.push(sub);
  }

  private onListStateChange(newState: EntryListState) {
    const newListVm = new EntryListViewModel(newState.loadedEntries, this.timeGroupService);

    if (this.listVm) {
      this.listVm.mergeFrom(newListVm);
    }
    else {
      this.listVm = newListVm;
    }

    this.loadedEntries = newState.loadedEntries;
    this.canLoadMore = newState.canLoadMore;
    this.loadMoreToken = newState.loadMoreToken;
  }

  private createEntryDialogConfig(config: { isEdit: boolean } = { isEdit: false }): MatDialogConfig {
    let result = {
      viewContainerRef: this.viewContainer
    };

    if (!this.isMobile()) {
      if (!config.isEdit) {
        result = Object.assign(result, {
          maxWidth: '500px',
          position: { bottom: '74px', right: '74px' }
        });
      }
    }
    else {
      result = Object.assign(result, {
        width: '100vw',
        maxWidth: '100vw',
        position: { top: '56px' }
      });
    }

    return result;
  }

  private isMobile() {
    return window.screen.width < 768;
  }

  private async loadRandomEntry() {
    this.isLoadingRandomEntry = true;

    try {
      const getRandomEntry = () => firstValueFrom(this.randomEntryService.getRandomEntry());

      const prevEntry = this.randomEntry;
      let newEntry = await getRandomEntry();

      if (prevEntry && newEntry && prevEntry.id === newEntry.id) {
        // We go the same random entry as previous one, let's try one more time
        newEntry = await getRandomEntry();
      }

      this.randomEntry = newEntry;
    }
    finally {
      this.isLoadingRandomEntry = false;
    }

  }
}

