import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Entry, TranslationService } from 'shared';

@Component({
  selector: 'app-entry-editor-dialog',
  templateUrl: './entry-editor-dialog.component.html',
  styleUrls: ['./entry-editor-dialog.component.scss']
})
export class EntryEditorDialogComponent {
  entryForm: FormGroup;
  isTranslating: boolean;
  translationError: boolean;
  detectedLanguage: string | undefined;

  @ViewChild('translationTextArea') translationTextArea: ElementRef;

  constructor(
      private dialogRef: MatDialogRef<EntryEditorDialogComponent>,
      private fb: FormBuilder,
      private translationService: TranslationService) {

    this.entryForm = fb.group({
      originalText: ['', Validators.required],
      translation: ['']
    });
  }

  setEntry(entry: Entry) {
    this.entryForm.setValue({ originalText: entry.originalText, translation: entry.translation });
    this.entryForm.markAsPristine();
  }

  async translate() {
    const originalText = this.entryForm.value.originalText;
    if (!originalText) {
      return;
    }

    this.translationError = false;
    this.isTranslating = true;
    this.entryForm.controls['translation'].disable();

    try {
      const translation = await this.translationService.translate(originalText);
      this.entryForm.controls['translation'].setValue(translation.en);
      this.detectedLanguage = translation.detectedSourceLanguage;
    }
    catch (e) {
      this.translationError = true;
      console.error(e);
    }
    finally {
      this.isTranslating = false;
      this.entryForm.controls['translation'].enable();
    }
  }

  async onOriginalTextKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      await this.translate();

      this.translationTextArea.nativeElement.select();
      this.translationTextArea.nativeElement.focus();
    }
  }

  onTranslationTextKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onSubmit() {
    if (!this.entryForm.valid) {
      return;
    }

    this.dialogRef.close(this.entryForm.value);
  }
}
