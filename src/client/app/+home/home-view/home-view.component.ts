import { Component, OnInit } from '@angular/core';
import { MdDialog } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry } from 'shared';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';

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

  entries: Entry[] = [
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' }),
    new Entry({ originalText: 'word', translation: 'translation' })
  ];

  constructor(private dialog: MdDialog) { }

  ngOnInit() {
  }

  addNewEntry() {
    this.dialog.open(EntryEditorDialogComponent).afterClosed().subscribe((result: Entry) => {
      if (result) {
        const entry = new Entry(result);
        entry.isNew = true;

        this.entries.unshift(entry);
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

  onDeleteRequested(entry: Entry) {
    const entryIndex = this.entries.findIndex(x => x.equals(entry));

    if (entryIndex >= 0) {
      this.entries.splice(entryIndex, 1);
    }
  }
}
