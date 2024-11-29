import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { Entry } from '../model';
import { TranslationService } from '../translation';

export interface EntryEditorDialogData {
  entry?: Entry;
}

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
    MatHint,
    MatProgressSpinner,
    MatSuffix,
    MatButton,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryEditorDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<EntryEditorDialogComponent>>(MatDialogRef);
  private readonly translationService = inject(TranslationService);
  private readonly dialogData: EntryEditorDialogData = inject(MAT_DIALOG_DATA);

  protected readonly isTranslating = signal(false);
  protected readonly translationError = signal(false);
  protected readonly detectedLanguage = signal<string | undefined>(undefined);

  protected readonly entryForm = new FormGroup({
    originalText: new FormControl(this.dialogData.entry?.originalText ?? '', {
      validators: Validators.required,
      nonNullable: true,
    }),
    translation: new FormControl<string | undefined>(this.dialogData.entry?.translation ?? '', [Validators.required]),
  });

  protected readonly translationTextArea = viewChild.required<ElementRef>('translationTextArea');

  protected async translate(): Promise<void> {
    const originalText = this.entryForm.value.originalText;
    if (!originalText) {
      return;
    }

    this.translationError.set(false);
    this.isTranslating.set(true);
    this.entryForm.controls['translation'].disable();

    try {
      const translation = await this.translationService.translate(originalText);
      this.entryForm.controls['translation'].setValue(translation.en);
      this.detectedLanguage.set(translation.detectedSourceLanguage);
    } catch (e) {
      this.translationError.set(true);
      console.error(e);
    } finally {
      this.isTranslating.set(false);
      this.entryForm.controls['translation'].enable();
    }
  }

  protected async onOriginalTextKeyPress(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Enter') {
      event.preventDefault();
      await this.translate();

      this.translationTextArea().nativeElement.select();
      this.translationTextArea().nativeElement.focus();
    }
  }

  protected onTranslationTextKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }

  protected onSubmit(): void {
    if (!this.entryForm.valid) {
      return;
    }

    this.dialogRef.close(this.entryForm.value);
  }
}
