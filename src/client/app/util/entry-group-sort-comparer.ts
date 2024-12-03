import { EntryListTimeGroupViewModel } from '../entry-list/entry-list-time-group.vm';
import { createSortComparer } from './sort';

export const entryGroupSortComparer = createSortComparer((g: EntryListTimeGroupViewModel) => g.order, 'desc');
