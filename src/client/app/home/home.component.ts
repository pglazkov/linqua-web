import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry, EntryStorageService } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { EntryTimeGroupViewModel, EntryViewModel } from './entry.vm';
import { EntryListViewModel } from './entry-list.vm';
import { Subject } from 'rxjs/Subject';
import { filter, first } from 'rxjs/operators';
import { ISubscription } from 'rxjs/Subscription';

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
  randomEntry: Entry | undefined;

  @ViewChild('list', {read: ElementRef}) listElement: ElementRef;

  private readonly ngUnsubscribe: ISubscription[] = [];

  private readonly listStateSubject = new Subject<EntryListState>();

  private loadedEntries: Entry[] = [];

  constructor(private dialog: MatDialog, private storage: EntryStorageService, private viewContainer: ViewContainerRef) {
    this.listStateSubject.subscribe(s => this.onListStateChange(s));
  }

  ngOnInit() {
    this.loadRandomEntry();
    this.loadEntryList();
  }

  async loadMore() {
    this.isLoadingMore = true;

    try {
      const result = await this.storage.getEntriesStream(this.loadMoreToken).pipe(
        filter(r => !r.fromCache),
        first()
      ).toPromise();

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

    const result: Entry = await this.dialog.open(EntryEditorDialogComponent, this.createEntryDialogConfig())
      .afterClosed()
      .pipe(first())
      .toPromise();

    if (result) {
      result.id = this.storage.getNewId();

      const entry = new EntryViewModel(result);

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

    const result: Entry = await editorDialog.afterClosed().pipe(first()).toPromise();

    if (result) {
      Object.assign(entry, result);
      entry.updatedOn = new Date();
      await this.storage.addOrUpdate(entry);
    }
  }

  async onDeleteRequested(entry: EntryViewModel, group: EntryTimeGroupViewModel) {
    if (this.listVm === undefined) {
      return;
    }

    const entryIndex = this.loadedEntries.findIndex(x => x.id === entry.id);

    if (entryIndex >= 0) {
      this.loadedEntries.splice(entryIndex, 1);
    }

    this.listVm.deleteEntry(entry, group);

    await this.storage.delete(entry.id);
  }

  async onUpdateRandomEntryRequested() {
    await this.loadRandomEntry();
  }

  trackByGroup(index: number, group: EntryTimeGroupViewModel) {
    return group.date;
  }

  trackByEntry(index: number, entry: EntryViewModel) {
    return entry.id;
  }

  private loadEntryList() {
    let sub: ISubscription = {
      unsubscribe: () => {
      }, closed: true
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
    const newListVm = new EntryListViewModel(newState.loadedEntries);

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
    this.randomEntry = await this.storage.randomEntry$.toPromise();
  }
}

