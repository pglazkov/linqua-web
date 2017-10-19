import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry, EntryStorageService } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { EntryTimeGroupViewModel, EntryViewModel } from './entry.vm';
import { EntryListViewModel } from './entry-list.vm';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss'],
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
export class HomeViewComponent implements OnInit, OnDestroy {
  listVm: EntryListViewModel | undefined;

  @ViewChild('list', {read: ElementRef}) listElement: ElementRef;

  private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(private dialog: MatDialog, private storage: EntryStorageService) {
  }

  ngOnInit() {
    this.storage.getEntries().takeUntil(this.ngUnsubscribe).subscribe((entries: Entry[]) => {
      this.listVm = new EntryListViewModel(entries);
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  addNewEntry() {
    const listVm = this.listVm;

    if (listVm === undefined) {
      return;
    }

    this.dialog.open(EntryEditorDialogComponent).afterClosed().subscribe((result: Entry) => {
      if (result) {
        const entry = new EntryViewModel(result);
        entry.isNew = true;

        listVm.addEntry(entry);

        this.listElement.nativeElement.scrollTop = 0;

        this.storage.addOrUpdate(entry.model);
      }
    });
  }

  onEditRequested(entry: Entry) {
    if (this.listVm === undefined) {
      return;
    }

    const editorDialog = this.dialog.open(EntryEditorDialogComponent);
    editorDialog.componentInstance.setEntry(entry);

    editorDialog.afterClosed().subscribe((result: Entry) => {
      if (result) {
        Object.assign(entry, result);
        entry.updatedOn = new Date();
        this.storage.addOrUpdate(entry);
      }
    });
  }

  onDeleteRequested(entry: EntryViewModel, group: EntryTimeGroupViewModel) {
    if (this.listVm === undefined) {
      return;
    }

    this.listVm.deleteEntry(entry, group);
    this.storage.delete(entry.id);
  }
}

