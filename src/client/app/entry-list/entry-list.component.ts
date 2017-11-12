import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry, EntryStorageService } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { EntryTimeGroupViewModel, EntryViewModel } from './entry.vm';
import { EntryListViewModel } from './entry-list.vm';
import { Subject } from 'rxjs/Subject';
import { takeUntil, first } from 'rxjs/operators';

@Component({
  selector: 'app-home-view',
  templateUrl: './entry-list.component.html',
  styleUrls: ['./entry-list.component.scss'],
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
export class EntryListComponent implements OnInit, OnDestroy {
  listVm: EntryListViewModel | undefined;
  canLoadMore = false;
  loadMoreToken: any;
  isInitialLoading = true;
  isLoadingMore = false;

  @ViewChild('list', {read: ElementRef}) listElement: ElementRef;

  private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

  private loadedEntries: Entry[] = [];

  constructor(private dialog: MatDialog, private storage: EntryStorageService, private viewContainer: ViewContainerRef) {
  }

  async ngOnInit() {
    this.isInitialLoading = true;

    try {
      await this.loadEntries();
    }
    finally {
      this.isInitialLoading = false;
    }
  }

  private async loadEntries() {
    const result = await this.storage.getEntries(this.loadMoreToken).pipe(
      takeUntil(this.ngUnsubscribe),
      first()
    ).toPromise();

    this.loadedEntries = this.loadedEntries.concat(result.entries);
    this.canLoadMore = result.hasMore;
    this.loadMoreToken = result.loadMoreToken;
    this.listVm = new EntryListViewModel(this.loadedEntries);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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

  async loadMore() {
    this.isLoadingMore = true;

    try {
      await this.loadEntries();
    }
    finally {
      this.isLoadingMore = false;
    }
  }

  trackByGroup(index: number, group: EntryTimeGroupViewModel) {
    return group.date;
  }

  trackByEntry(index: number, entry: EntryViewModel) {
    return entry.id;
  }

  private createEntryDialogConfig(config: { isEdit: boolean } = { isEdit: false }): MatDialogConfig {
    let result = {
      viewContainerRef: this.viewContainer,
      maxWidth: '500px',
      width: '100%'
    };

    if (!this.isMobile()) {
      if (!config.isEdit) {
        result = Object.assign(result, {
          position: { bottom: '74px', right: '74px' }
        });
      }
    }
    else {
      result = Object.assign(result, {
        position: { top: '56px' }
      });
    }

    return result;
  }

  private isMobile() {
    return window.screen.width < 768;
  }
}

