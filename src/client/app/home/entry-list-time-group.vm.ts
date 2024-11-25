import { EntryListItemViewModel } from './entry-list-item.vm';

export class EntryListTimeGroupViewModel {
  order: number;
  name: string;
  entries: EntryListItemViewModel[];

  constructor(
    private readonly entrySortCompareFunc: (a: { addedOn: Date }, b: { addedOn: Date }) => number,
    order: number,
    name: string,
    entries: EntryListItemViewModel[],
  ) {
    this.order = order;
    this.name = name;
    this.entries = entries;
  }

  addEntry(entry: EntryListItemViewModel) {
    this.entries.unshift(entry);

    this.entries.sort(this.entrySortCompareFunc);
  }

  deleteEntry(entry: EntryListItemViewModel) {
    const entryIndex = this.entries.findIndex(x => x.equals(entry));

    if (entryIndex >= 0) {
      this.entries.splice(entryIndex, 1);
    }
  }

  mergeFrom(otherGroup: EntryListTimeGroupViewModel) {
    for (const otherEntry of otherGroup.entries) {
      const thisEntry = this.entries.find(e => e.id === otherEntry.id);

      if (thisEntry) {
        this.entries[this.entries.indexOf(thisEntry)] = otherEntry;
      } else {
        this.entries.push(otherEntry);
      }
    }

    for (const thisEntry of this.entries) {
      const otherEntry = this.entries.find(e => e.id === thisEntry.id);

      if (!otherEntry) {
        this.entries.splice(this.entries.indexOf(thisEntry), 1);
      }
    }

    this.entries.sort(this.entrySortCompareFunc);
  }

  equals(otherGroup: EntryListTimeGroupViewModel | undefined): boolean {
    if (!otherGroup) {
      return false;
    }

    return this.name === otherGroup.name;
  }
}
