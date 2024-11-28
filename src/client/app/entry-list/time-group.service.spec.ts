import { inject, TestBed } from '@angular/core/testing';

import { TimeGroupKey } from './time-group';
import { TimeGroupService } from './time-group.service';

const now = new Date(Date.parse('2018-03-31T13:58+0000')); // Saturday

describe('TimeGroupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimeGroupService],
    });
  });

  it('should be created', inject([TimeGroupService], (service: TimeGroupService) => {
    expect(service).toBeTruthy();
  }));

  it('today', inject([TimeGroupService], (service: TimeGroupService) => {
    const today = new Date(now.getTime());
    today.setHours(now.getHours() - 1);

    const group = service.getTimeGroup(today, now);
    expect(group.key).toBe(TimeGroupKey.Today);
  }));

  it('yesterday', inject([TimeGroupService], (service: TimeGroupService) => {
    const yesterday = new Date(now.getTime());
    yesterday.setDate(now.getDate() - 1);

    const group = service.getTimeGroup(yesterday, now);
    expect(group.key).toBe(TimeGroupKey.Yesterday);
  }));

  it('thursday', inject([TimeGroupService], (service: TimeGroupService) => {
    const thursday = new Date(now.getTime());
    thursday.setDate(now.getDate() - 2);

    const group = service.getTimeGroup(thursday, now);
    expect(group.key).toBe(TimeGroupKey.Thursday);
  }));

  it('wednesday', inject([TimeGroupService], (service: TimeGroupService) => {
    const wednesday = new Date(now.getTime());
    wednesday.setDate(now.getDate() - 3);

    const group = service.getTimeGroup(wednesday, now);
    expect(group.key).toBe(TimeGroupKey.Wednesday);
  }));

  it('tuesday', inject([TimeGroupService], (service: TimeGroupService) => {
    const tuesday = new Date(now.getTime());
    tuesday.setDate(now.getDate() - 4);

    const group = service.getTimeGroup(tuesday, now);
    expect(group.key).toBe(TimeGroupKey.Tuesday);
  }));

  it('monday', inject([TimeGroupService], (service: TimeGroupService) => {
    const monday = new Date(now.getTime());
    monday.setDate(now.getDate() - 5);

    const group = service.getTimeGroup(monday, now);
    expect(group.key).toBe(TimeGroupKey.Monday);
  }));

  it('last week', inject([TimeGroupService], (service: TimeGroupService) => {
    const lastWeek = new Date(now.getTime());
    lastWeek.setDate(now.getDate() - 6);

    const group = service.getTimeGroup(lastWeek, now);
    expect(group.key).toBe(TimeGroupKey.LastWeek);
  }));

  it('2 weeks ago', inject([TimeGroupService], (service: TimeGroupService) => {
    const twoWeeksAgo = new Date(now.getTime());
    twoWeeksAgo.setDate(now.getDate() - 13);

    const group = service.getTimeGroup(twoWeeksAgo, now);
    expect(group.key).toBe(TimeGroupKey.WeeksAgo2);
  }));

  it('3 weeks ago', inject([TimeGroupService], (service: TimeGroupService) => {
    const threeWeeksAgo = new Date(now.getTime());
    threeWeeksAgo.setDate(now.getDate() - 20);

    const group = service.getTimeGroup(threeWeeksAgo, now);
    expect(group.key).toBe(TimeGroupKey.WeeksAgo3);
  }));

  it('4 weeks ago', inject([TimeGroupService], (service: TimeGroupService) => {
    const fourWeeksAgo = new Date(now.getTime());
    fourWeeksAgo.setDate(now.getDate() - 27);

    const group = service.getTimeGroup(fourWeeksAgo, now);
    expect(group.key).toBe(TimeGroupKey.WeeksAgo4);
  }));

  it('last month', inject([TimeGroupService], (service: TimeGroupService) => {
    const lastMonth = new Date(now.getTime());
    lastMonth.setDate(now.getDate() - 32);

    const group = service.getTimeGroup(lastMonth, now);
    expect(group.key).toBe(TimeGroupKey.LastMonth);
  }));

  it('older', inject([TimeGroupService], (service: TimeGroupService) => {
    const olderThanTwoMonths = new Date(now.getTime());
    olderThanTwoMonths.setDate(now.getDate() - 62);

    const group = service.getTimeGroup(olderThanTwoMonths, now);
    expect(group.key).toBe(TimeGroupKey.Older);
  }));

  it('[bug] last month previous year', inject([TimeGroupService], (service: TimeGroupService) => {
    // This test was intended to reproduce and fix a bug where "last month" was returned for a date that was
    // last month, but on a different year
    const lastMonthPreviousYear = new Date(now.getTime());
    lastMonthPreviousYear.setDate(now.getDate() - 32);
    lastMonthPreviousYear.setFullYear(lastMonthPreviousYear.getFullYear() - 1);

    const group = service.getTimeGroup(lastMonthPreviousYear, now);
    expect(group.key).toBe(TimeGroupKey.Older);
  }));
});
