import { computed, Injectable, signal } from '@angular/core';
import { enableMapSet, produce, WritableDraft } from 'immer';

import { Entry } from '../model';
import { createSortComparer, getDateWithoutTime } from '../util';
import { createTimeGroup, TimeGroupKey } from './time-group';

enableMapSet();

export interface EntryState {
  readonly data: Entry;
  readonly uiState: {
    readonly isLearned: boolean;
    readonly animationTrigger: 'new' | undefined;
  };
}

export interface EntryListGroupState {
  readonly order: number;
  readonly name: string;
  readonly entries: EntryState[];
}

@Injectable()
export class EntryListState {
  private readonly entryById = signal(new Map<string, EntryState>());

  readonly timeGroups = computed(() => this.createTimeGroups(Array.from(this.entryById().values())));

  setEntries(entries: Entry[]): void {
    this.patch(entryById => {
      for (const entry of entries) {
        entryById.set(entry.id, {
          data: entry,
          uiState: {
            animationTrigger: undefined,
            isLearned: false,
          },
        });
      }
    });
  }

  addEntry(entry: Entry): void {
    this.patch(entryById => {
      const entryState: EntryState = { data: entry, uiState: { animationTrigger: 'new', isLearned: false } };

      entryById.set(entry.id, entryState);
    });
  }

  deleteEntry(entryId: string): void {
    this.patch(entryById => {
      entryById.delete(entryId);
    });
  }

  toggleIsLearned(entryId: string): boolean {
    const entry = this.entryById().get(entryId);

    if (!entry) {
      throw new Error(`Entry with id ${entryId} not found`);
    }

    const newValue = !entry.uiState.isLearned;

    this.patch(entryById => {
      const entryState = entryById.get(entryId)!;

      entryState.uiState.isLearned = newValue;
    });

    return newValue;
  }

  setEntryAnimationTrigger(entryId: string, animationState: EntryState['uiState']['animationTrigger']): void {
    this.patch(entryById => {
      const entryState = entryById.get(entryId);
      if (entryState) {
        entryState.uiState.animationTrigger = animationState;
      }
    });
  }

  updateEntry(entry: Entry): void {
    this.patch(entryById => {
      const currentState = entryById.get(entry.id);
      if (currentState) {
        entryById.set(entry.id, { ...currentState, data: entry });
      }
    });
  }

  private createTimeGroups(entries: EntryState[]): EntryListGroupState[] {
    const groupMap = new Map<TimeGroupKey, EntryListGroupState>();

    for (const entry of entries) {
      const timeGroup = createTimeGroup(getDateWithoutTime(entry.data.addedOn));

      let group = groupMap.get(timeGroup.key);

      if (!group) {
        group = {
          order: timeGroup.order,
          name: timeGroup.englishName,
          entries: [],
        };

        groupMap.set(timeGroup.key, group);
      }

      group.entries.unshift(entry);
    }

    const result = Array.from(groupMap.values());
    result.sort(createSortComparer((g: EntryListGroupState) => g.order, 'desc'));

    for (const group of result) {
      group.entries.sort(createSortComparer((e: EntryState) => e.data.addedOn, 'desc'));
    }

    return result;
  }

  private patch(updateFunc: (draft: Map<string, WritableDraft<EntryState>>) => void) {
    this.entryById.set(produce(this.entryById(), updateFunc));
  }
}
