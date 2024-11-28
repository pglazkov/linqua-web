export enum TimeGroupKey {
  Older,
  LastMonth,
  WeeksAgo4,
  WeeksAgo3,
  WeeksAgo2,
  LastWeek,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
  Yesterday,
  Today,
  Tomorrow,
  Monday2,
  Tuesday2,
  Wednesday2,
  Thursday2,
  Friday2,
  Saturday2,
  Sunday2,
  NextWeek,
  In2Weeks,
  In3Weeks,
  In4Weeks,
  NextMonth,
  Newer,
}

export interface TimeGroup {
  key: TimeGroupKey;
  order: number;
  englishName: string;
}
