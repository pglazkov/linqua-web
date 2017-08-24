import { Entry, EntryConfig } from 'shared';

export class EntryViewModel {
  get id() {
    return this.model.id;
  }

  get originalText() {
    return this.model.originalText;
  }
  set originalText(value) {
    this.model.originalText = value;
  }

  get translation() {
    return this.model.translation;
  }
  set translation(value) {
    this.model.translation = value;
  }

  get addedOn() {
    return this.model.addedOn;
  }
  set addedOn(value) {
    this.model.addedOn = value;
  }

  get updatedOn() {
    return this.model.updatedOn;
  }
  set updatedOn(value) {
    this.model.updatedOn = value;
  }

  isNew?: boolean;

  private model: Entry;

  constructor(entry: Entry | EntryConfig) {
    this.model = (entry instanceof Entry) ? entry : new Entry(entry);
    this.isNew = false;
  }

  equals(other: EntryViewModel) {
    return this.model.equals(other.model);
  }
}

export class EntryTimeGroupViewModel {
  date: Date;
  entries: EntryViewModel[];
}
