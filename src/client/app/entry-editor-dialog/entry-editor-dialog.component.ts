import { NgIf } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Entry, TranslationService } from '@linqua/shared';

@Component({
  selector: 'app-entry-editor-dialog',
  templateUrl: './entry-editor-dialog.component.html',
  styleUrls: ['./entry-editor-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    NgIf,
    MatHint,
    MatProgressSpinner,
    MatSuffix,
    MatButton,
    MatIcon,
  ],
})
export class EntryEditorDialogComponent {
  isTranslating: boolean = false;
  translationError: boolean = false;
  detectedLanguage: string | undefined;

  entryForm = new FormGroup({
    originalText: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    translation: new FormControl<string | undefined>('', [Validators.required]),
  });

  @ViewChild('translationTextArea', { static: true })
  translationTextArea!: ElementRef;

  constructor(
    private dialogRef: MatDialogRef<EntryEditorDialogComponent>,
    private translationService: TranslationService,
  ) {}

  setEntry(entry: Entry) {
    this.entryForm.setValue({
      originalText: entry.originalText,
      translation: entry.translation,
    });
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
    } catch (e) {
      this.translationError = true;
      console.error(e);
    } finally {
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
