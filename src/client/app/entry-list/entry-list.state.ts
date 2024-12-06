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
  _entryMap: Map<string, EntryState>;
  // groups: EntryListGroupState[];
  isLoaded: boolean;
}

export const entrySortComparer = createSortComparer((o: EntryState) => o.model.addedOn, 'desc');
export const groupSortComparer = createSortComparer((g: EntryListGroupState) => g.order, 'desc');

const initialState: EntryListState = {
  _entryMap: new Map<string, EntryState>(),
  // groups: [],
  isLoaded: false,
};

export const EntryStore = signalStore(
  withState(initialState),
  withComputed(({ _entryMap }) => ({
    groupsComputed: computed(() => {
      const entryStateList = Array.from(_entryMap().values());

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
      patchState(store, state => {
        return produce(state, draft => {
          const entryStateList: EntryState[] = entries.map(e => ({ model: e, isNew: false, isLearned: false }));

          draft._entryMap = new Map(entryStateList.map(e => [e.model.id, e]));
          // draft.groups = [];
          //
          // const sortedEntries = entryStateList.sort(entrySortComparer).reverse();
          //
          // for (const entry of sortedEntries) {
          //   addEntry(draft, entry);
          // }

          draft.isLoaded = true;
        });
      });
    },

    addEntry(entry: Entry): void {
      patchState(store, state => {
        return produce(state, draft => {
          const entryState: EntryState = { model: entry, isNew: true, isLearned: false };

          draft._entryMap.set(entry.id, entryState);

          //addEntry(draft, entryState);
        });
      });
    },

    deleteEntry(entryId: string): void {
      patchState(store, state => {
        return produce(state, draft => {
          draft._entryMap.delete(entryId);
          // const { entryState, entryGroupState } = findStateForEntry(draft, entryId);
          //
          // if (entryGroupState && entryState) {
          //   deleteEntry(draft, entryGroupState, entryState);
          // }
        });
      });
    },

    toggleIsLearned(entryId: string): boolean {
      const newValue = !store._entryMap().get(entryId)!.isLearned;

      patchState(store, state => {
        return produce(state, draft => {
          draft._entryMap.get(entryId)!.isLearned = newValue;

          // const { entryState, entryGroupState } = findStateForEntry(draft, entryId);
          //
          // if (entryGroupState && entryState) {
          //   entryState.isLearned = newValue;
          // }
        });
      });

      return newValue;
    },

    setIsNew(entryId: string, isNew: boolean): void {
      patchState(store, state => {
        return produce(state, draft => {
          const entryState = draft._entryMap.get(entryId);
          if (entryState) {
            entryState.isNew = isNew;
          }

          // const stateInsideGroup = findStateForEntry(draft, entryId);
          //
          // if (stateInsideGroup.entryGroupState && stateInsideGroup.entryState) {
          //   stateInsideGroup.entryState.isNew = isNew;
          // }
        });
      });
    },

    // deleteEmptyGroups(): void {
    //   patchState(store, state => {
    //     return produce(state, draft => {
    //       let groupIndexToDelete: number;
    //       while ((groupIndexToDelete = draft.groups.findIndex(group => group.entries.length === 0)) >= 0) {
    //         draft.groups.splice(groupIndexToDelete, 1);
    //       }
    //     });
    //   });
    // },

    updateEntry(entry: Entry): void {
      patchState(store, state => {
        return produce(state, draft => {
          const existingEntryState = draft._entryMap.get(entry.id);
          if (existingEntryState) {
            draft._entryMap.set(entry.id, {
              model: entry,
              isLearned: existingEntryState.isLearned,
              isNew: existingEntryState.isNew,
            });
          }

          // const { entryState } = findStateForEntry(draft, entry.id);
          //
          // if (entryState) {
          //   entryState.model = entry;
          //   draft._entryMap.set(entry.id, entryState);
          // }
        });
      });
    },
  })),
  withHooks({
    onInit(store) {
      watchState(store, state => {
        console.log('[watchState]', state);
      });

      effect(() => {
        console.log('[effect]', store.groupsComputed());
      });
    },
  }),
);

// function findOrCreateTimeGroupForEntry(state: EntryListState, entry: EntryState): EntryListGroupState {
//   const timeGroup = createTimeGroup(getDateWithoutTime(entry.model.addedOn));
//
//   let group = state.groups.find(g => g.name === timeGroup.englishName);
//
//   if (!group) {
//     group = {
//       order: timeGroup.order,
//       name: timeGroup.englishName,
//       entries: [],
//     };
//
//     state.groups.unshift(group);
//     state.groups.sort(groupSortComparer);
//   }
//
//   return group;
// }

// function addEntry(state: EntryListState, entry: EntryState): void {
//   state._entryMap.set(entry.model.id, entry);
//
//   const group = findOrCreateTimeGroupForEntry(state, entry);
//
//   group.entries.unshift(entry);
//   group.entries.sort(entrySortComparer);
// }
//
// function deleteEntry(state: EntryListState, entryGroupState: EntryListGroupState, entry: EntryState): void {
//   const entryIndex = entryGroupState.entries.findIndex(x => x.model.id === entry.model.id);
//
//   if (entryIndex >= 0) {
//     entryGroupState.entries.splice(entryIndex, 1);
//   }
//
//   state._entryMap.delete(entry.model.id);
// }
//
// function findStateForEntry(
//   state: EntryListState,
//   entryId: string,
// ): {
//   entryState: EntryState | undefined;
//   entryGroupState: EntryListGroupState | undefined;
// } {
//   for (const groupState of state.groups) {
//     const entryState = groupState.entries.find(x => x.model.id === entryId);
//
//     if (entryState) {
//       return { entryState: entryState, entryGroupState: groupState };
//     }
//   }
//
//   return { entryState: undefined, entryGroupState: undefined };
// }
