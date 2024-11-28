export interface EntryConfig {
  id?: string;
  originalText: string;
  translation?: string;
  addedOn?: Date;
  updatedOn?: Date;
}

export class Entry implements EntryConfig {
  id: string = '';
  originalText: string = '';
  translation?: string;
  addedOn: Date = new Date();
  updatedOn?: Date;

  constructor(prototype?: EntryConfig) {
    if (prototype) {
      Object.assign(this, prototype);
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
