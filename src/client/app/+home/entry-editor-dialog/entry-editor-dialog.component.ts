import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Entry } from 'shared';

@Component({
  selector: 'app-entry-editor-dialog',
  templateUrl: './entry-editor-dialog.component.html',
  styleUrls: ['./entry-editor-dialog.component.scss']
})
export class EntryEditorDialogComponent {
  entryForm: FormGroup;

  constructor(private dialogRef: MdDialogRef<EntryEditorDialogComponent>, private fb: FormBuilder) {
    this.entryForm = fb.group({
      originalText: ['', Validators.required],
      translation: ['']
    });
  }

  setEntry(entry: Entry) {
    this.entryForm.setValue({ originalText: entry.originalText, translation: entry.translation });
    this.entryForm.markAsPristine();
  }

  onSubmit() {
    if (!this.entryForm.valid) {
      return;
    }

    this.dialogRef.close(this.entryForm.value);
  }
}
