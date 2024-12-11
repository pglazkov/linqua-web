import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { enableMapSet, produce } from 'immer';

import { Entry } from '../model';
import { createSortComparer, getDateWithoutTime } from '../util';
import { createTimeGroup, TimeGroupKey } from './time-group';

enableMapSet();

export interface EntryState {
  readonly data: Entry;
  readonly uiState: {
    readonly isLearned: boolean;
    readonly isNew: boolean;
  };
}

export interface EntryListGroupState {
  readonly order: number;
  readonly name: string;
  readonly entries: EntryState[];
}

interface EntryListState {
  readonly _entryById: Map<string, EntryState>;
}

const initialState: EntryListState = {
  _entryById: new Map<string, EntryState>(),
};

export const EntryListStore = signalStore(
  withState(initialState),
  withComputed(({ _entryById }) => ({
    timeGroups: computed(() => createTimeGroups(Array.from(_entryById().values()))),
  })),
  withMethods(store => ({
    setEntries(entries: Entry[]): void {
      patchState(
        store,
        produce<EntryListState>(draft => {
          for (const entry of entries) {
            draft._entryById.set(entry.id, {
              data: entry,
              uiState: {
                isNew: false,
                isLearned: false,
              },
            });
          }
        }),
      );
    },

    addEntry(entry: Entry): void {
      patchState(
        store,
        produce<EntryListState>(draft => {
          const entryState: EntryState = { data: entry, uiState: { isNew: true, isLearned: false } };

          draft._entryById.set(entry.id, entryState);
        }),
      );
    },

    deleteEntry(entryId: string): void {
      patchState(
        store,
        produce<EntryListState>(draft => {
          draft._entryById.delete(entryId);
        }),
      );
    },

    toggleIsLearned(entryId: string): boolean {
      const entry = store._entryById().get(entryId);

      if (!entry) {
        throw new Error(`Entry with id ${entryId} not found`);
      }

      const newValue = !entry.uiState.isLearned;

      patchState(
        store,
        produce<EntryListState>(draft => {
          const entryState = draft._entryById.get(entryId)!;

          entryState.uiState.isLearned = newValue;
        }),
      );

      return newValue;
    },

    setIsNew(entryId: string, isNew: boolean): void {
      patchState(
        store,
        produce<EntryListState>(draft => {
          const entryState = draft._entryById.get(entryId);
          if (entryState) {
            entryState.uiState.isNew = isNew;
          }
        }),
      );
    },

    updateEntry(entry: Entry): void {
      patchState(
        store,
        produce<EntryListState>(draft => {
          const currentState = draft._entryById.get(entry.id);
          if (currentState) {
            draft._entryById.set(entry.id, { ...currentState, data: entry });
          }
        }),
      );
    },
  })),
);

function createTimeGroups(entries: EntryState[]): EntryListGroupState[] {
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
  result.sort(groupSortComparer);

  for (const group of result) {
    group.entries.sort(entrySortComparer);
  }

  return result;
}

export const entrySortComparer = createSortComparer((o: EntryState) => o.data.addedOn, 'desc');
export const groupSortComparer = createSortComparer((g: EntryListGroupState) => g.order, 'desc');
