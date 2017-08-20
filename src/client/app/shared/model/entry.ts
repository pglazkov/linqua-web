import { uniqueId } from '../util';

export interface EntryConfig {
  originalText: string;
  translation?: string;
  addedOn?: Date;
  updatedOn?: Date;
}

export class Entry implements EntryConfig {
  id: string;
  originalText: string;
  translation?: string;
  addedOn?: Date;
  updatedOn?: Date;
  isNew?: boolean;

  constructor(prototype?: EntryConfig) {
    if (prototype) {
      Object.assign(this, prototype);
    }

    if (!this.id) {
      this.id = uniqueId();
    }

    if (!this.addedOn) {
      this.addedOn = new Date();
    }

    if (!this.updatedOn) {
      this.updatedOn = this.addedOn;
    }

    if (!this.translation) {
      this.translation = this.originalText;
    }
  }

  equals(anotherEntry: Entry): boolean {
    return this.id === anotherEntry.id;
  }
}
