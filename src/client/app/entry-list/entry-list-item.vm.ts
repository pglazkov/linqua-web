import { signal } from '@angular/core';

import { Entry, EntryConfig } from '../model';

export class EntryListItemViewModel {
  private readonly _id = signal<string>('');
  private readonly _originalText = signal('');
  private readonly _translation = signal<string | undefined>(undefined);
  private readonly _addedOn = signal<Date>(new Date());

  readonly id = this._id.asReadonly();
  readonly originalText = this._originalText.asReadonly();
  readonly translation = this._translation.asReadonly();
  readonly addedOn = this._addedOn.asReadonly();

  readonly isNew = signal<boolean | undefined>(undefined);
  readonly isLearned = signal(false);

  readonly model: Entry;

  constructor(entry: Entry | EntryConfig) {
    this.model = entry instanceof Entry ? entry : new Entry(entry);

    this.syncFromModel(this.model);
    this.isNew.set(false);
  }

  onModelUpdated(updatedModel: Entry) {
    Object.assign(this.model, updatedModel);
    this.syncFromModel(this.model);
  }

  equals(other: EntryListItemViewModel) {
    return this.model.equals(other.model);
  }

  private syncFromModel(model: Entry): void {
    this._id.set(model.id);
    this._originalText.set(model.originalText);
    this._translation.set(model.translation);
    this._addedOn.set(model.addedOn);
  }
}
