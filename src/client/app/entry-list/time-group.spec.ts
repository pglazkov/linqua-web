import { createTimeGroup, TimeGroupKey } from './time-group';

const now = new Date(Date.parse('2018-03-31T13:58+0000')); // Saturday

describe('createTimeGroup', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(now);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('today', () => {
    const today = new Date(now.getTime());
    today.setHours(now.getHours() - 1);

    const group = createTimeGroup(today, now);
    expect(group.key).toBe(TimeGroupKey.Today);
  });

  it('yesterday', () => {
    const yesterday = new Date(now.getTime());
    yesterday.setDate(now.getDate() - 1);

    const group = createTimeGroup(yesterday, now);
    expect(group.key).toBe(TimeGroupKey.Yesterday);
  });

  it('thursday', () => {
    const thursday = new Date(now.getTime());
    thursday.setDate(now.getDate() - 2);

    const group = createTimeGroup(thursday, now);
    expect(group.key).toBe(TimeGroupKey.Thursday);
  });

  it('wednesday', () => {
    const wednesday = new Date(now.getTime());
    wednesday.setDate(now.getDate() - 3);

    const group = createTimeGroup(wednesday, now);
    expect(group.key).toBe(TimeGroupKey.Wednesday);
  });

  it('tuesday', () => {
    const tuesday = new Date(now.getTime());
    tuesday.setDate(now.getDate() - 4);

    const group = createTimeGroup(tuesday, now);
    expect(group.key).toBe(TimeGroupKey.Tuesday);
  });

  it('monday', () => {
    const monday = new Date(now.getTime());
    monday.setDate(now.getDate() - 5);

    const group = createTimeGroup(monday, now);
    expect(group.key).toBe(TimeGroupKey.Monday);
  });

  it('last week', () => {
    const lastWeek = new Date(now.getTime());
    lastWeek.setDate(now.getDate() - 6);

    const group = createTimeGroup(lastWeek, now);
    expect(group.key).toBe(TimeGroupKey.LastWeek);
  });

  it('2 weeks ago', () => {
    const twoWeeksAgo = new Date(now.getTime());
    twoWeeksAgo.setDate(now.getDate() - 13);

    const group = createTimeGroup(twoWeeksAgo, now);
    expect(group.key).toBe(TimeGroupKey.WeeksAgo2);
  });

  it('3 weeks ago', () => {
    const threeWeeksAgo = new Date(now.getTime());
    threeWeeksAgo.setDate(now.getDate() - 20);

    const group = createTimeGroup(threeWeeksAgo, now);
    expect(group.key).toBe(TimeGroupKey.WeeksAgo3);
  });

  it('4 weeks ago', () => {
    const fourWeeksAgo = new Date(now.getTime());
    fourWeeksAgo.setDate(now.getDate() - 27);

    const group = createTimeGroup(fourWeeksAgo, now);
    expect(group.key).toBe(TimeGroupKey.WeeksAgo4);
  });

  it('last month', () => {
    const lastMonth = new Date(now.getTime());
    lastMonth.setDate(now.getDate() - 32);

    const group = createTimeGroup(lastMonth, now);
    expect(group.key).toBe(TimeGroupKey.LastMonth);
  });

  it('older', () => {
    const olderThanTwoMonths = new Date(now.getTime());
    olderThanTwoMonths.setDate(now.getDate() - 62);

    const group = createTimeGroup(olderThanTwoMonths, now);
    expect(group.key).toBe(TimeGroupKey.Older);
  });

  it('[bug] last month previous year', () => {
    // This test was intended to reproduce and fix a bug where "last month" was returned for a date that was
    // last month, but on a different year
    const lastMonthPreviousYear = new Date(now.getTime());
    lastMonthPreviousYear.setDate(now.getDate() - 32);
    lastMonthPreviousYear.setFullYear(lastMonthPreviousYear.getFullYear() - 1);

    const group = createTimeGroup(lastMonthPreviousYear, now);
    expect(group.key).toBe(TimeGroupKey.Older);
  });
});
