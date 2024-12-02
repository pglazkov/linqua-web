import { EntryListItemViewModel } from './entry-list-item.vm';

export class EntryListTimeGroupViewModel {
  constructor(
    private readonly entrySortCompareFunc: (a: { addedOn: Date }, b: { addedOn: Date }) => number,
    public readonly order: number,
    public readonly name: string,
    public readonly entries: EntryListItemViewModel[],
  ) {}

  addEntry(entry: EntryListItemViewModel) {
    this.entries.unshift(entry);

    this.sortEntries();
  }

  deleteEntry(entry: EntryListItemViewModel) {
    const entryIndex = this.entries.findIndex(x => x.equals(entry));

    if (entryIndex >= 0) {
      this.entries.splice(entryIndex, 1);
    }
  }

  mergeFrom(otherGroup: EntryListTimeGroupViewModel) {
    for (const otherEntry of otherGroup.entries) {
      const thisEntry = this.entries.find(e => e.id() === otherEntry.id());

      if (thisEntry) {
        this.entries[this.entries.indexOf(thisEntry)] = otherEntry;
      } else {
        this.entries.push(otherEntry);
      }
    }

    for (const thisEntry of this.entries) {
      const otherEntry = this.entries.find(e => e.id() === thisEntry.id());

      if (!otherEntry) {
        this.entries.splice(this.entries.indexOf(thisEntry), 1);
      }
    }

    this.sortEntries();
  }

  equals(otherGroup: EntryListTimeGroupViewModel | undefined): boolean {
    if (!otherGroup) {
      return false;
    }

    return this.name === otherGroup.name;
  }

  private sortEntries(): void {
    this.entries.sort((a, b) => this.entrySortCompareFunc(a.model, b.model));
  }
}
