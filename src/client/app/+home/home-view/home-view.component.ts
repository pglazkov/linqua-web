import { Component, OnInit } from '@angular/core';
import { MdDialog } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';
import { Entry } from 'shared';

@Component({
  selector: 'app-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
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
        this.entries.unshift(new Entry(result));
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
