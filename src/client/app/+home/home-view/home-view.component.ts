import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MdDialog } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { EntryTimeGroupViewModel, EntryViewModel } from './entry.vm';

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
export class HomeViewComponent implements OnInit {

  entries: EntryViewModel[] = [
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' }),
    new EntryViewModel({ originalText: 'word', translation: 'translation' })
  ];

  groups: EntryTimeGroupViewModel[] = [
    { date: new Date(Date.UTC(2017, 7, 1)), entries: this.entries.slice(0, 8) },
    { date: new Date(Date.UTC(2017, 7, 8)), entries: this.entries.slice(8, 15) }
  ];

  @ViewChild('list') listElement: ElementRef;

  constructor(private dialog: MdDialog) { }

  ngOnInit() {
  }

  addNewEntry() {
    this.dialog.open(EntryEditorDialogComponent).afterClosed().subscribe((result: Entry) => {
      if (result) {
        const entry = new EntryViewModel(result);
        entry.isNew = true;

        const group = this.findOrCreateTimeGroupForEntry(entry);

        group.entries.unshift(entry);

        this.listElement.nativeElement.scrollTop = 0;
      }
    });
  }

  onEditRequested(entry: Entry) {
    const editorDialog = this.dialog.open(EntryEditorDialogComponent);
    editorDialog.componentInstance.setEntry(entry);

    editorDialog.afterClosed().subscribe((result: Entry) => {
      if (result) {
        Object.assign(entry, result);
      }
    });
  }

  onDeleteRequested(entry: EntryViewModel, group: EntryTimeGroupViewModel) {
    const entryIndex = group.entries.findIndex(x => x.equals(entry));

    if (entryIndex >= 0) {
      group.entries.splice(entryIndex, 1);
    }

    if (group.entries.length === 0) {
      this.groups.splice(this.groups.indexOf(group), 1);
    }
  }

  private findOrCreateTimeGroupForEntry(entry: EntryViewModel) {
    let entryDate = entry.addedOn;
    if (!entryDate) {
      entryDate = new Date();
    }

    const dateWithoutTime = new Date(entryDate);
    dateWithoutTime.setHours(0, 0, 0, 0);

    let group = this.groups.find(g => g.date.getTime() === dateWithoutTime.getTime());

    if (!group) {
      group = new EntryTimeGroupViewModel();
      group.date = dateWithoutTime;
      group.entries = [];

      this.groups.unshift(group);
    }

    return group;
  }
}
