import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../auth';
import { Entry } from '../../model';
import { EntryStorageService } from '../../storage';
import { RandomEntryService } from './random-entry.service';

describe('RandomEntryService', () => {
  const mockUserId = 'test-user-id';
  const mockEntries: readonly Entry[] = [
    {
      id: '1',
      originalText: 'Hello',
      translation: 'Hello (translated)',
      addedOn: new Date('2023-01-01'),
      updatedOn: new Date('2023-01-05'),
    },
    {
      id: '2',
      originalText: 'World',
      translation: 'World (translated)',
      addedOn: new Date('2023-02-01'),
      updatedOn: new Date('2023-02-05'),
    },
    {
      id: '3',
      originalText: 'How are you?',
      translation: 'How are you? (translated)',
      addedOn: new Date('2023-03-01'),
      updatedOn: new Date('2023-03-05'),
    },
  ];

  interface SetupConfig {
    apiResult: readonly Entry[];
  }

  const defaultConfig: SetupConfig = {
    apiResult: mockEntries,
  };

  const setup = (customConfig: Partial<SetupConfig> = {}) => {
    const config = { ...defaultConfig, ...customConfig };

    const memoryStorage = new Map<string, string>();
    const localStorageMock = jasmine.createSpyObj<Storage>('localStorage', ['getItem', 'setItem', 'removeItem']);
    localStorageMock.getItem.and.callFake((key: string) => memoryStorage.get(key) ?? null);
    localStorageMock.setItem.and.callFake((key: string, value: string) => memoryStorage.set(key, value));
    localStorageMock.removeItem.and.callFake((key: string) => memoryStorage.delete(key));

    spyOnProperty(window, 'localStorage').and.returnValue(localStorageMock);

    // Create mock services
    const authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [], { userId: mockUserId });
    const entryStorageServiceMock = jasmine.createSpyObj<EntryStorageService>('EntryStorageService', [
      'getRandomEntryBatch',
    ]);
    entryStorageServiceMock.getRandomEntryBatch.and.returnValue(of(config.apiResult));

    // Configure Testing Module
    TestBed.configureTestingModule({
      providers: [
        RandomEntryService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: EntryStorageService, useValue: entryStorageServiceMock },
      ],
    });

    return {
      service: TestBed.inject(RandomEntryService),
      authServiceMock,
      localStorageMock,
      entryStorageServiceMock,
    };
  };

  describe('getRandomEntry', () => {
    it('should return entries in reverse order and cache API results', async () => {
      const { service, entryStorageServiceMock } = setup({ apiResult: mockEntries });

      expect(entryStorageServiceMock.getRandomEntryBatch).toHaveBeenCalledTimes(1);

      for (let i = 1; i <= mockEntries.length; i++) {
        expect(await service.getRandomEntry()).toEqual(mockEntries[mockEntries.length - i]);
      }

      // First call is initial loading of random entries and
      // second one is after all entries from the first call were already returned
      const expectedCalls = 2;
      expect(entryStorageServiceMock.getRandomEntryBatch).toHaveBeenCalledTimes(expectedCalls);
    });
  });

  describe('onEntryUpdated', () => {
    it('should update an existing entry in the batch', async () => {
      const { service } = setup({ apiResult: mockEntries });

      const updatedEntry: Entry = {
        ...mockEntries[mockEntries.length - 1],
        translation: 'test (updated)',
      };

      await service.onEntryUpdated(updatedEntry);

      const randomEntry = await service.getRandomEntry();

      expect(randomEntry).toEqual(updatedEntry);
    });
  });

  describe('onEntryDeleted', () => {
    it('should remove an entry from the batch', async () => {
      const { service } = setup({ apiResult: mockEntries });

      const entryToDelete = mockEntries[mockEntries.length - 1];
      await service.onEntryDeleted(entryToDelete);

      const randomEntry = await service.getRandomEntry();

      expect(randomEntry).toEqual(mockEntries[mockEntries.length - 2]);
    });

    it('should reload the next batch when the batch becomes empty', async () => {
      const { service, entryStorageServiceMock } = setup({ apiResult: [mockEntries[0]] });
      expect(entryStorageServiceMock.getRandomEntryBatch).toHaveBeenCalledTimes(1);

      await service.onEntryDeleted(mockEntries[0]); // Delete last remaining entry

      expect(entryStorageServiceMock.getRandomEntryBatch).toHaveBeenCalledTimes(2);
    });
  });
});
