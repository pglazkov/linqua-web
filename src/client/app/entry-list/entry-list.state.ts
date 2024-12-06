import { computed, effect } from '@angular/core';
import { patchState, signalStore, watchState, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { enableMapSet, produce } from 'immer';

import { Entry } from '../model';
import { createSortComparer, getDateWithoutTime } from '../util';
import { createTimeGroup, TimeGroupKey } from './time-group';

enableMapSet();

interface EntryState {
  model: Entry;
  isLearned: boolean;
  isNew: boolean;
}

interface EntryListGroupState {
  order: number;
  name: string;
  entries: EntryState[];
}

interface EntryListState {
  _entryStateMap: Map<string, EntryState>;
  isLoaded: boolean;
}

export const entrySortComparer = createSortComparer((o: EntryState) => o.model.addedOn, 'desc');
export const groupSortComparer = createSortComparer((g: EntryListGroupState) => g.order, 'desc');

const initialState: EntryListState = {
  _entryStateMap: new Map<string, EntryState>(),
  // groups: [],
  isLoaded: false,
};

export const EntryStore = signalStore(
  withState(initialState),
  withComputed(({ _entryStateMap }) => ({
    timeGroups: computed(() => {
      const entryStateList = Array.from(_entryStateMap().values());

      const groupMap = new Map<TimeGroupKey, EntryListGroupState>();

      for (const entry of entryStateList) {
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
    }),
  })),
  withMethods(store => ({
    setEntries(entries: Entry[]): void {
      patchState(
        store,
        produce(draft => {
          draft._entryStateMap = new Map(
            entries.map(e => ({ model: e, isNew: false, isLearned: false })).map(e => [e.model.id, e]),
          );

          draft.isLoaded = true;
        }),
      );
    },

    addEntry(entry: Entry): void {
      patchState(
        store,
        produce(draft => {
          const entryState: EntryState = { model: entry, isNew: true, isLearned: false };

          draft._entryStateMap.set(entry.id, entryState);
        }),
      );
    },

    deleteEntry(entryId: string): void {
      patchState(
        store,
        produce(draft => {
          draft._entryStateMap.delete(entryId);
        }),
      );
    },

    toggleIsLearned(entryId: string): boolean {
      const newValue = !store._entryStateMap().get(entryId)!.isLearned;

      patchState(
        store,
        produce(draft => {
          draft._entryStateMap.get(entryId)!.isLearned = newValue;
        }),
      );

      return newValue;
    },

    setIsNew(entryId: string, isNew: boolean): void {
      patchState(
        store,
        produce(draft => {
          const entryState = draft._entryStateMap.get(entryId);
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
          const existingEntryState = draft._entryStateMap.get(entry.id);
          if (existingEntryState) {
            draft._entryStateMap.set(entry.id, {
              model: entry,
              isLearned: existingEntryState.isLearned,
              isNew: existingEntryState.isNew,
            });
          }
        }),
      );
    },
  })),
  withHooks({
    onInit(store) {
      watchState(store, state => {
        console.log('[watchState]', state);
      });

      effect(() => {
        console.log('[effect]', store.timeGroups());
      });
    },
  }),
);
