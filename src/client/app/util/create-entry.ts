import { Entry } from '../model';

export function createEntry(config?: Partial<Entry>): Entry {
  return {
    id: config?.id ?? '',
    originalText: config?.originalText ?? '',
    translation: config?.translation ?? config?.originalText ?? '',
    addedOn: config?.addedOn ?? new Date(),
    updatedOn: config?.updatedOn ?? new Date(),
  };
}
