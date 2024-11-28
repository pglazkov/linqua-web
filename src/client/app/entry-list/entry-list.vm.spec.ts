import { TestBed } from '@angular/core/testing';
import uniqueId from 'lodash-es/uniqueId';

import { Entry } from '../model';
import { CurrentDateProvider } from '../util';
import { EntryListViewModel } from './entry-list.vm';
import { EntryListItemViewModel } from './entry-list-item.vm';
import { TimeGroupService } from './time-group.service';

const currentDate = new Date(2018, 3, 15, 12, 0, 0, 0);

function genEntry(addedOnDaysOffset?: number): Entry {
  const addedOn = new Date(currentDate);

  if (addedOnDaysOffset) {
    addedOn.setDate(addedOn.getDate() + addedOnDaysOffset);
  }

  return new Entry({
    id: uniqueId(),
    addedOn: addedOn,
    updatedOn: addedOn,
    originalText: 'test',
    translation: 'test',
  });
}

describe('EntryListViewModel', () => {
  let currentDateProvider!: jasmine.SpyObj<CurrentDateProvider>;
  let timeGroupService!: TimeGroupService;

  beforeEach(() => {
    currentDateProvider = jasmine.createSpyObj('CurrentDateProvider', ['getCurrentDate']);
    currentDateProvider.getCurrentDate.and.returnValue(currentDate);

    TestBed.configureTestingModule({
      providers: [{ provide: CurrentDateProvider, useValue: currentDateProvider }, TimeGroupService],
    });

    timeGroupService = TestBed.inject(TimeGroupService);
  });

  it('should create correct time groups', () => {
    const entries = [
      genEntry(), // Today
      genEntry(-1), // Yesterday
      genEntry(-7), // Last week
      genEntry(-30), // Last month
      genEntry(-60), // Older
    ];

    const sut = new EntryListViewModel(entries, timeGroupService, currentDateProvider);

    expect(sut.groups.length).toBe(5);
    expect(sut.groups[0].name).toBe('Today');
    expect(sut.groups[1].name).toBe('Yesterday');
    expect(sut.groups[2].name).toBe('Last week');
    expect(sut.groups[3].name).toBe('Last month');
    expect(sut.groups[4].name).toBe('Older');

    for (let i = 0; i < sut.groups.length - 1; i++) {
      expect(sut.groups[i].order > sut.groups[i + 1].order).toBe(
        true,
        `Expected group ${sut.groups[i].name} to come before group ${sut.groups[i + 1].name}`,
      );
    }
  });

  it('mergeFrom - groups should be updated correctly', () => {
    const initialEntries = [
      genEntry(), // Today
      genEntry(-25), // Last month
      genEntry(-60), // Older
    ];

    const sut = new EntryListViewModel(initialEntries, timeGroupService, currentDateProvider);

    expect(sut.groups.length).toBe(3);
    expect(sut.groups[0].name).toBe('Today');
    expect(sut.groups[1].name).toBe('Last month');
    expect(sut.groups[2].name).toBe('Older');

    const updatedEntries = [
      ...initialEntries,
      genEntry(-7), // Last week
      genEntry(-30), // Last month
      genEntry(-90), // Older
    ];

    sut.mergeFrom(new EntryListViewModel(updatedEntries, timeGroupService, currentDateProvider));

    const orderedGroups = sut.groups.sort(EntryListViewModel.groupSortComparerFunc);

    expect(orderedGroups.length).toBe(4);
    expect(orderedGroups[0].name).toBe('Today');
    expect(orderedGroups[0].entries.length).toBe(1);
    expect(orderedGroups[1].name).toBe('Last week');
    expect(orderedGroups[1].entries.length).toBe(1);
    expect(orderedGroups[2].name).toBe('Last month');
    expect(orderedGroups[2].entries.length).toBe(2);
    expect(orderedGroups[3].name).toBe('Older');
    expect(orderedGroups[3].entries.length).toBe(2);
  });

  it('addEntry - should be added to existing group', () => {
    const initialEntries = [
      genEntry(-25), // Last month
      genEntry(-60), // Older
    ];

    const sut = new EntryListViewModel(initialEntries, timeGroupService, currentDateProvider);

    expect(sut.groups.length).toBe(2);
    expect(sut.groups[0].name).toBe('Last month');
    expect(sut.groups[0].entries.length).toBe(1);
    expect(sut.groups[1].name).toBe('Older');
    expect(sut.groups[1].entries.length).toBe(1);

    sut.addEntry(
      new EntryListItemViewModel(genEntry(-20)), // Last month
    );

    expect(sut.groups.length).toBe(2);
    expect(sut.groups[0].entries.length).toBe(2);
    expect(sut.groups[1].entries.length).toBe(1);
  });

  it('addEntry - new group should be created if does not exist', () => {
    const initialEntries = [
      genEntry(-25), // Last month
      genEntry(-60), // Older
    ];

    const sut = new EntryListViewModel(initialEntries, timeGroupService, currentDateProvider);

    expect(sut.groups.length).toBe(2);
    expect(sut.groups[0].name).toBe('Last month');
    expect(sut.groups[0].entries.length).toBe(1);
    expect(sut.groups[1].name).toBe('Older');
    expect(sut.groups[1].entries.length).toBe(1);

    sut.addEntry(
      new EntryListItemViewModel(genEntry()), // Today
    );

    expect(sut.groups.length).toBe(3);
    expect(sut.groups[0].name).toBe('Today');
    expect(sut.groups[0].entries.length).toBe(1);
    expect(sut.groups[1].entries.length).toBe(1);
    expect(sut.groups[2].entries.length).toBe(1);
  });
});
