import { Injectable } from '@angular/core';

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
  Newer
}

const locale: { [localeName: string]: Map<TimeGroupKey, string> } = {
  'en': new Map([
    [ TimeGroupKey.Older, 'Older' ],
    [ TimeGroupKey.LastMonth, 'Last month' ],
    [ TimeGroupKey.WeeksAgo4, '4 weeks ago' ],
    [ TimeGroupKey.WeeksAgo3, '3 weeks ago' ],
    [ TimeGroupKey.WeeksAgo2, '2 weeks ago' ],
    [ TimeGroupKey.LastWeek, 'Last week' ],
    [ TimeGroupKey.Monday, 'Monday' ],
    [ TimeGroupKey.Tuesday, 'Tuesday' ],
    [ TimeGroupKey.Wednesday, 'Wednesday' ],
    [ TimeGroupKey.Thursday, 'Thursday' ],
    [ TimeGroupKey.Friday, 'Friday' ],
    [ TimeGroupKey.Saturday, 'Saturday' ],
    [ TimeGroupKey.Sunday, 'Sunday' ],
    [ TimeGroupKey.Yesterday, 'Yesterday' ],
    [ TimeGroupKey.Today, 'Today' ],
    [ TimeGroupKey.Tomorrow, 'Tomorrow' ],
    [ TimeGroupKey.Monday2, 'Monday' ],
    [ TimeGroupKey.Tuesday2, 'Tuesday' ],
    [ TimeGroupKey.Wednesday2, 'Wednesday' ],
    [ TimeGroupKey.Thursday2, 'Thursday' ],
    [ TimeGroupKey.Friday2, 'Friday' ],
    [ TimeGroupKey.Saturday2, 'Saturday' ],
    [ TimeGroupKey.Sunday2, 'Sunday' ],
    [ TimeGroupKey.NextWeek, 'Next week' ],
    [ TimeGroupKey.In2Weeks, 'In 2 weeks' ],
    [ TimeGroupKey.In3Weeks, 'In 3 weeks' ],
    [ TimeGroupKey.In4Weeks, 'In 4 weeks' ],
    [ TimeGroupKey.NextMonth, 'Next month' ],
    [ TimeGroupKey.Newer,  'Newer' ]
  ])
};

const groupTimeScale: TimeGroupKey[] = [
  TimeGroupKey.Older,
  TimeGroupKey.LastMonth,
  TimeGroupKey.WeeksAgo4,
  TimeGroupKey.WeeksAgo3,
  TimeGroupKey.WeeksAgo2,
  TimeGroupKey.LastWeek,
  TimeGroupKey.Monday,
  TimeGroupKey.Tuesday,
  TimeGroupKey.Wednesday,
  TimeGroupKey.Thursday,
  TimeGroupKey.Friday,
  TimeGroupKey.Saturday,
  TimeGroupKey.Sunday,
  TimeGroupKey.Yesterday,
  TimeGroupKey.Today,
  TimeGroupKey.Tomorrow,
  TimeGroupKey.Monday2,
  TimeGroupKey.Tuesday2,
  TimeGroupKey.Wednesday2,
  TimeGroupKey.Thursday2,
  TimeGroupKey.Friday2,
  TimeGroupKey.Saturday2,
  TimeGroupKey.Sunday2,
  TimeGroupKey.NextWeek,
  TimeGroupKey.In2Weeks,
  TimeGroupKey.In3Weeks,
  TimeGroupKey.In4Weeks,
  TimeGroupKey.NextMonth,
  TimeGroupKey.Newer
];

const indexOfToday = groupTimeScale.indexOf(TimeGroupKey.Today);

export interface TimeGroup {
  key: TimeGroupKey;
  order: number;
  englishName: string;
}

@Injectable()
export class TimeGroupService {
  constructor() {
  }

  getTimeGroup(target: Date, reference?: Date): TimeGroup {
    reference = reference || new Date();

    const result = (relativeToToday: number): TimeGroup => {
      const group = groupTimeScale[relativeToToday + indexOfToday];
      const englishName = locale['en'].get(group);

      if (!englishName) {
        throw new Error(`English name cannot be found for group ${TimeGroupKey[group]}`);
      }
      return {
        key: group,
        order: relativeToToday,
        englishName: englishName
      };
    };

    const sourceWeakDay = (target.getDay() + 6) % 7;
    const refWeakDay = (reference.getDay() + 6) % 7;

    const ts = dateDiffInDays(reference, target);

    if (ts === 0) {
      return result(0); // same day
    }
    if (ts === 1) {
      return result(-1); // day before
    }

    if (ts === -1) {
      return result(1); // day after
    }

    // same week
    if ((ts > 1) && (ts <= refWeakDay)) {
      return result(sourceWeakDay - 8);
    }

    if ((-ts > 1) && (-ts <= 6 - refWeakDay)) {
      return result(sourceWeakDay + 2);
    }

    // previous / next weeks
    for (let nIdx = 0; nIdx <= 3; nIdx++) {
      if ((ts > refWeakDay + nIdx * 7) &&
        (ts <= refWeakDay + (nIdx + 1) * 7)) {
        if (reference.getMonth() === target.getMonth()) {
          return result(-(9 + nIdx));
        }
        else {
          return result(-13);
        }
      }
      if ((-ts > 6 - refWeakDay + nIdx * 7) &&
        (-ts <= 6 - refWeakDay + (nIdx + 1) * 7)) {
        if (reference.getMonth() === target.getMonth()) {
          return result((9 + nIdx));
        }
        else {
          return result(13);
        }
      }
    }

    if (Math.abs(target.getMonth() - reference.getMonth()) === 1) {
      return result(Math.sign(ts) * (-13));
    }

    return result(Math.sign(ts) * (-14));
  }
}


// Taken from https://stackoverflow.com/a/15289883
const MS_PER_DAY = 1000 * 60 * 60 * 24;
// a and b are javascript Date objects
function dateDiffInDays(a: Date, b: Date) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc1 - utc2) / MS_PER_DAY);
}

