import { createSortComparer } from './sort';

export const entrySortComparer = createSortComparer((o: { addedOn: Date }) => o.addedOn, 'desc');
