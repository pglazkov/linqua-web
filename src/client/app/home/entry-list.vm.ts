import { EntryListItemViewModel } from './entry-list-item.vm';
import { createSortComparer, Entry, TimeGroupService } from '@linqua/shared';
import { EntryListTimeGroupViewModel } from './entry-list-time-group.vm';

const entryDeletionAnimationDuration = 200;

export class EntryListViewModel {
  static readonly entrySortCompareFunc =
    createSortComparer((o: { addedOn: Date }) => o.addedOn, 'desc');

  static readonly groupSortComparerFunc =
    createSortComparer((g: EntryListTimeGroupViewModel) => g.order, 'desc');

  groups: EntryListTimeGroupViewModel[] = [];

  constructor(entries: Entry[], private timeGroupService: TimeGroupService) {
    const sortedEntries = entries.sort(EntryListViewModel.entrySortCompareFunc).reverse();

    for (const entry of sortedEntries) {
      this.addEntry(new EntryListItemViewModel(entry));
    }
  }

  addEntry(entry: EntryListItemViewModel) {
    const group = this.findOrCreateTimeGroupForEntry(entry);

    group.addEntry(entry);
  }

  deleteEntry(entry: EntryListItemViewModel, group: EntryListTimeGroupViewModel) {
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

    for (const thisGroup of this.groups) {
      const otherGroup = other.groups.find(g => g.equals(thisGroup));

      if (!otherGroup) {
        this.groups.splice(this.groups.indexOf(thisGroup), 1);
      }
    }

    this.groups.sort(EntryListViewModel.groupSortComparerFunc);
  }

  onEntryUpdated(entry: Entry) {
    const vms = this.findViewModelsForEntry(entry);

    if (vms) {
      vms.entryVm.onModelUpdated(entry);
    }
  }

  findViewModelsForEntry(entry: Entry): { entryVm: EntryListItemViewModel; entryGroupVm: EntryListTimeGroupViewModel } | undefined {
    for (const groupVm of this.groups) {
      const entryVm = groupVm.entries.find(x => x.id === entry.id);

      if (entryVm) {
        return { entryVm: entryVm, entryGroupVm: groupVm };
      }
    }

    return undefined;
  }

  private findOrCreateTimeGroupForEntry(entry: EntryListItemViewModel) {
    let entryDate = entry.addedOn;
    if (!entryDate) {
      entryDate = new Date();
    }

    const dateWithoutTime = new Date(entryDate);
    dateWithoutTime.setHours(0, 0, 0, 0);

    const timeGroup = this.timeGroupService.getTimeGroup(dateWithoutTime);

    let group = this.groups.find(g => g.name === timeGroup.englishName);

    if (!group) {
      group = new EntryListTimeGroupViewModel(EntryListViewModel.entrySortCompareFunc, timeGroup.order, timeGroup.englishName, []);

      this.groups.unshift(group);
      this.groups.sort(EntryListViewModel.groupSortComparerFunc);
    }

    return group;
  }
}
