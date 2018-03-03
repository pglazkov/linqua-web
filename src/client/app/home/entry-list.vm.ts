import { EntryTimeGroupViewModel, EntryViewModel } from './entry.vm';
import { createSortComparer, Entry, TimeGroupService } from 'shared';

const entryDeletionAnimationDuration = 200;

export class EntryListViewModel {
  static readonly entrySortCompareFunc =
    createSortComparer((o: { addedOn: Date }) => o.addedOn, 'desc');

  static readonly groupSortComparerFunc =
    createSortComparer((g: EntryTimeGroupViewModel) => g.order, 'desc');

  groups: EntryTimeGroupViewModel[] = [];

  constructor(entries: Entry[], private timeGroupService: TimeGroupService) {
    const sortedEntries = entries.sort(EntryListViewModel.entrySortCompareFunc).reverse();

    for (const entry of sortedEntries) {
      this.addEntry(new EntryViewModel(entry));
    }
  }

  addEntry(entry: EntryViewModel) {
    const group = this.findOrCreateTimeGroupForEntry(entry);

    group.addEntry(entry);
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

  mergeFrom(other: EntryListViewModel) {
    for (const otherGroup of other.groups) {
      const thisGroup = this.groups.find(g => g.equals(otherGroup));

      if (thisGroup) {
        thisGroup.mergeFrom(otherGroup);
      }
      else {
        this.groups.push(otherGroup);
      }
    }

    this.groups.sort(EntryListViewModel.groupSortComparerFunc);
  }

  private findOrCreateTimeGroupForEntry(entry: EntryViewModel) {
    let entryDate = entry.addedOn;
    if (!entryDate) {
      entryDate = new Date();
    }

    const dateWithoutTime = new Date(entryDate);
    dateWithoutTime.setHours(0, 0, 0, 0);

    const timeGroup = this.timeGroupService.getTimeGroup(dateWithoutTime);

    let group = this.groups.find(g => g.name === timeGroup.englishName);

    if (!group) {
      group = new EntryTimeGroupViewModel(EntryListViewModel.entrySortCompareFunc);
      group.order = timeGroup.order;
      group.name = timeGroup.englishName;
      group.entries = [];

      this.groups.unshift(group);
      this.groups.sort(EntryListViewModel.groupSortComparerFunc);
    }

    return group;
  }
}
