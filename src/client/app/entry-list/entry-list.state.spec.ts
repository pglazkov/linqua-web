import { TestBed } from '@angular/core/testing';
import uniqueId from 'lodash-es/uniqueId';

import { Entry } from '../model';
import { createEntry } from '../util/create-entry';
import { EntryListState } from './entry-list.state';

const currentDate = new Date(2018, 3, 15, 12, 0, 0, 0);

function genEntry(addedOnDaysOffset?: number): Entry {
  const addedOn = new Date(currentDate);

  if (addedOnDaysOffset) {
    addedOn.setDate(addedOn.getDate() + addedOnDaysOffset);
  }

  return createEntry({
    id: uniqueId(),
    addedOn: addedOn,
    updatedOn: addedOn,
    originalText: 'test',
    translation: 'test',
  });
}

describe('EntryListState', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(currentDate);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [EntryListState],
    });

    return TestBed.inject(EntryListState);
  };

  it('should create correct time groups', () => {
    const state = setup();

    const entries = [
      genEntry(), // Today
      genEntry(-1), // Yesterday
      genEntry(-7), // Last week
      genEntry(-30), // Last month
      genEntry(-60), // Older
    ];

    state.setEntries(entries);

    const groups = state.timeGroups();

    expect(groups.length).toBe(5);
    expect(groups[0].name).toBe('Today');
    expect(groups[1].name).toBe('Yesterday');
    expect(groups[2].name).toBe('Last week');
    expect(groups[3].name).toBe('Last month');
    expect(groups[4].name).toBe('Older');

    for (let i = 0; i < groups.length - 1; i++) {
      expect(groups[i].order > groups[i + 1].order)
        .withContext(`Expected group ${groups[i].name} to come before group ${groups[i + 1].name}`)
        .toBe(true);
    }
  });

  it('mergeFrom - groups should be updated correctly', () => {
    const store = setup();

    const initialEntries = [
      genEntry(), // Today
      genEntry(-25), // Last month
      genEntry(-60), // Older
    ];

    store.setEntries(initialEntries);

    let groups = store.timeGroups();

    expect(groups.length).toBe(3);
    expect(groups[0].name).toBe('Today');
    expect(groups[1].name).toBe('Last month');
    expect(groups[2].name).toBe('Older');

    const updatedEntries = [
      ...initialEntries,
      genEntry(-7), // Last week
      genEntry(-30), // Last month
      genEntry(-90), // Older
    ];

    store.setEntries(updatedEntries);

    groups = store.timeGroups();

    expect(groups.length).toBe(4);
    expect(groups[0].name).toBe('Today');
    expect(groups[0].entries.length).toBe(1);
    expect(groups[1].name).toBe('Last week');
    expect(groups[1].entries.length).toBe(1);
    expect(groups[2].name).toBe('Last month');
    expect(groups[2].entries.length).toBe(2);
    expect(groups[3].name).toBe('Older');
    expect(groups[3].entries.length).toBe(2);
  });

  it('addEntry - should be added to existing group', () => {
    const store = setup();

    const initialEntries = [
      genEntry(-25), // Last month
      genEntry(-60), // Older
    ];

    store.setEntries(initialEntries);

    let groups = store.timeGroups();

    expect(groups.length).toBe(2);
    expect(groups[0].name).toBe('Last month');
    expect(groups[0].entries.length).toBe(1);
    expect(groups[1].name).toBe('Older');
    expect(groups[1].entries.length).toBe(1);

    store.addEntry(
      genEntry(-20), // Last month
    );

    groups = store.timeGroups();

    expect(groups.length).toBe(2);
    expect(groups[0].entries.length).toBe(2);
    expect(groups[1].entries.length).toBe(1);
  });

  it('addEntry - new group should be created if does not exist', () => {
    const store = setup();

    const initialEntries = [
      genEntry(-25), // Last month
      genEntry(-60), // Older
    ];

    store.setEntries(initialEntries);

    let groups = store.timeGroups();

    expect(groups.length).toBe(2);
    expect(groups[0].name).toBe('Last month');
    expect(groups[0].entries.length).toBe(1);
    expect(groups[1].name).toBe('Older');
    expect(groups[1].entries.length).toBe(1);

    store.addEntry(
      genEntry(), // Today
    );

    groups = store.timeGroups();

    expect(groups.length).toBe(3);
    expect(groups[0].name).toBe('Today');
    expect(groups[0].entries.length).toBe(1);
    expect(groups[1].entries.length).toBe(1);
    expect(groups[2].entries.length).toBe(1);
  });

  describe('toggleIsLearned', () => {
    it('should toggle isLearned state of an entry', () => {
      const state = setup();

      const entry = genEntry();
      state.setEntries([entry]);

      const firstToggleResult = state.toggleIsLearned(entry.id);
      expect(firstToggleResult).toBe(true);      
      expect(state.timeGroups()[0].entries[0].uiState.isLearned).toBe(true);

      const secondToggleResult = state.toggleIsLearned(entry.id);
      expect(secondToggleResult).toBe(false);
      expect(state.timeGroups()[0].entries[0].uiState.isLearned).toBe(false);
    });

    it('should throw error when toggling non-existent entry', () => {
      const state = setup();

      expect(() => state.toggleIsLearned('non-existent-id')).toThrow();
    });
  });
});
