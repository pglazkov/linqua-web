import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { enableMapSet, produce } from 'immer';

import { Entry } from '../model';
import { createSortComparer, getDateWithoutTime } from '../util';
import { createTimeGroup, TimeGroupKey } from './time-group';

enableMapSet();

interface EntryUiState {
  readonly isLearned: boolean;
  readonly isNew: boolean;
}

interface EntryModelWithUiState extends EntryUiState {
  readonly model: Entry;
}

interface EntryListGroupState {
  readonly order: number;
  readonly name: string;
  readonly entries: EntryModelWithUiState[];
}

interface EntryListStore {
  readonly _entryById: Map<string, EntryModelWithUiState>;
}

export const entrySortComparer = createSortComparer((o: EntryModelWithUiState) => o.model.addedOn, 'desc');
export const groupSortComparer = createSortComparer((g: EntryListGroupState) => g.order, 'desc');

const initialState: EntryListStore = {
  _entryById: new Map<string, EntryModelWithUiState>(),
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
        produce(draft => {
          for (const entry of entries) {
            draft._entryById.set(entry.id, withUiState(entry));
          }
        }),
      );
    },

    addEntry(entry: Entry): void {
      patchState(
        store,
        produce(draft => {
          const entryState: EntryModelWithUiState = withUiState(entry, { isNew: true, isLearned: false });

          draft._entryById.set(entry.id, entryState);
        }),
      );
    },

    deleteEntry(entryId: string): void {
      patchState(
        store,
        produce(draft => {
          draft._entryById.delete(entryId);
        }),
      );
    },

    toggleIsLearned(entryId: string): boolean {
      const entry = store._entryById().get(entryId);

      if (!entry) {
        throw new Error(`Entry with id ${entryId} not found`);
      }

      const newValue = !entry.isLearned;

      patchState(
        store,
        produce(draft => {
          draft._entryById.get(entryId)!.isLearned = newValue;
        }),
      );

      return newValue;
    },

    setIsNew(entryId: string, isNew: boolean): void {
      patchState(
        store,
        produce(draft => {
          const entryState = draft._entryById.get(entryId);
          if (entryState) {
            entryState.isNew = isNew;
          }
        }),
      );
    },

    updateEntry(entry: Entry): void {
      patchState(
        store,
        produce(draft => {
          const currentState = draft._entryById.get(entry.id);
          if (currentState) {
            draft._entryById.set(entry.id, withUiState(entry, currentState));
          }
        }),
      );
    },
  })),
);

function withUiState(
  entry: Entry,
  uiState: EntryUiState = {
    isNew: false,
    isLearned: false,
  },
): EntryModelWithUiState {
  return { model: entry, ...uiState };
}

function createTimeGroups(entries: EntryModelWithUiState[]): EntryListGroupState[] {
  const groupMap = new Map<TimeGroupKey, EntryListGroupState>();

  for (const entry of entries) {
    const timeGroup = createTimeGroup(getDateWithoutTime(entry.model.addedOn));

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
