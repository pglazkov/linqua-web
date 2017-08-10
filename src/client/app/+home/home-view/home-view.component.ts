import { Component, OnInit } from '@angular/core';
import { MdDialog } from '@angular/material';
import { EntryEditorDialogComponent } from '../entry-editor-dialog/entry-editor-dialog.component';

@Component({
  selector: 'app-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  entries: { text: string }[] = [
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' }
  ];

  constructor(private dialog: MdDialog) { }

  ngOnInit() {
  }

  addNewEntry() {
    this.dialog.open(EntryEditorDialogComponent).afterClosed().subscribe(result => {
      if (result) {
        this.entries.unshift({text: result});
      }
    });
  }
}
