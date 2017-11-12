import { EntryTimeGroupViewModel, EntryViewModel } from './entry.vm';
import { Entry } from 'shared';

const entryDeletionAnimationDuration = 200;

export class EntryListViewModel {
  readonly groups: EntryTimeGroupViewModel[] = [];

  constructor(entries: Entry[]) {
    const sortedEntries = entries.sort((a, b) => a.addedOn > b.addedOn ? 1 : (a.addedOn < b.addedOn ? -1 : 0));

    for (const entry of sortedEntries) {
      this.addEntry(new EntryViewModel(entry));
    }
  }

  addEntry(entry: EntryViewModel) {
    const group = this.findOrCreateTimeGroupForEntry(entry);

    group.entries.unshift(entry);
  }

  deleteEntry(entry: EntryViewModel, group: EntryTimeGroupViewModel) {
    group.deleteEntry(entry);

    if (group.entries.length === 0) {
      // Delay the removal of the group to let the deletion animation finish
      setTimeout(() => {
        this.groups.splice(this.groups.indexOf(group), 1);
      }, entryDeletionAnimationDuration);
    }
  }

  private findOrCreateTimeGroupForEntry(entry: EntryViewModel) {
    let entryDate = entry.addedOn;
    if (!entryDate) {
      entryDate = new Date();
    }

    const dateWithoutTime = new Date(entryDate);
    dateWithoutTime.setHours(0, 0, 0, 0);

    let group = this.groups.find(g => g.date.getTime() === dateWithoutTime.getTime());

    if (!group) {
      group = new EntryTimeGroupViewModel();
      group.date = dateWithoutTime;
      group.entries = [];

      this.groups.unshift(group);
    }

    return group;
  }
}
