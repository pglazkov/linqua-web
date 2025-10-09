# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linqua is a modern web application for learning foreign language vocabulary, built with Angular and Firebase. It provides real-time synchronization, offline support (PWA), and automatic English translations via Google Cloud Translate API.

## Development Commands

### Essential Commands
```bash
npm start                     # Start full dev environment with Firebase emulators and test data
npm run build                 # Development build
npm run build:prod           # Production build
npm test                     # Run unit tests with Firebase emulators
npm run e2e                  # Run Playwright E2E tests
npm run lint                 # Run ESLint checks
npm run lint:fix             # Auto-fix ESLint issues
npm run format               # Format code with Prettier
```

### Testing
```bash
npm run test:watch           # Unit tests in watch mode (Karma/Jasmine)
npm run ng-test              # Run unit tests once (headless)
npm run e2e:watch            # E2E tests with Playwright UI
npm run e2e:ci               # E2E tests in CI mode with Firebase emulators
```

### Firebase Emulators
```bash
npm run start:firebase-emulators:backend        # Start emulators (auth, firestore, functions)
npm run start:firebase-emulators:only-functions # Functions emulator only
```

### Deployment
```bash
npm run ci                           # Full CI pipeline (lint, test, e2e, build)
npm run deploy                       # Full deployment with CI checks
npm run deploy:only-frontend         # Deploy frontend only with CI checks
npm run deploy:only-frontend:skip-ci # Deploy frontend without CI (faster)
npm run deploy:firebase              # Deploy everything to Firebase
npm run deploy:firebase:hosting      # Deploy hosting only
```

## Architecture

### Frontend Structure (Angular Standalone)
```
src/client/app/
├── about-dialog/           # About dialog component
├── auth/                   # Firebase Authentication integration
├── entry-editor-dialog/    # Dialog for creating/editing vocabulary entries
├── entry-list/            # Main vocabulary list (CRUD, grouping by date, archiving)
├── firebase/              # Firebase service providers and factory functions
├── mat-dialog-override/   # Material Dialog customization
├── model/                 # TypeScript interfaces and data models
├── storage/               # Firestore data access layer
├── translation/           # Google Translate API integration
└── util/                  # Shared utilities
```

### Key Architectural Patterns

1. **Standalone Components**: All components use Angular standalone API - no NgModules
2. **Signal-based State**: Uses Angular signals with Immer for immutable state updates
3. **Firebase Integration**: Custom providers in `firebase/` directory with factory functions
4. **Real-time Updates**: Firestore listeners provide live synchronization
5. **Optimistic UI**: Client-side state updates before server confirmation

### State Management Pattern

The app uses Angular signals with Immer for state management:

```typescript
// Example from entry-list.state.ts:25-42
@Injectable()
export class EntryListState {
  private readonly entryById = signal(new Map<string, EntryState>());

  readonly timeGroups = computed(() => this.createTimeGroups(Array.from(this.entryById().values())));

  private patch(updater: (draft: WritableDraft<Map<string, EntryState>>) => void): void {
    this.entryById.update(state => produce(state, updater));
  }
}
```

### Firebase Cloud Functions
```
src/functions/
├── api/
│   ├── translate.js                # Translation API endpoint (HTTP callable)
│   └── get-random-entries-batch.js # Random entry selection (HTTP callable)
├── firestore-triggers/
│   └── update-user-collection-count.js # Auto-update entry counts
└── index.js                        # Function exports
```

## Critical Implementation Details

### Application Bootstrap
- Uses standalone component bootstrap in `src/client/main.ts:12`
- App configuration in `src/client/app/app-config.ts:11-27` with custom providers
- Firebase initialized via `provideFirebase()` custom provider

### Authentication Flow
- Firebase Auth with redirect-based flow (not popup)
- Auth state managed in `auth/` directory
- All API calls automatically include auth token

### Entry Management
- Entries grouped by time periods (Today, Yesterday, This Week, etc.) - see `entry-list/time-group.ts`
- Archive/unarchive functionality for learned words
- Real-time Firestore listeners update UI automatically
- State managed via `EntryListState` service using signals + Immer

### Translation Service
- Requires Google Cloud Translate API key (stored in Firebase Secrets)
- Automatic English translation for new vocabulary entries
- Implemented as Cloud Function to protect API key
- See `src/functions/api/translate.js`

### Testing Approach
- Unit tests use Karma/Jasmine (`.spec.ts` files alongside source)
- E2E tests use Playwright in `e2e/` directory
- All tests require Firebase emulators (auth, firestore, functions)
- Test data generation script: `scripts/generate-test-data.js`

## Development Setup

### Firebase Configuration
- Firebase emulators required for local development
- Automatically started with `npm start`
- Project ID: `linqua-cab88` (see `.firebaserc`)
- Translate API key setup: See `firebase.md` for instructions

### Environment Variables
- No local `.env` files needed
- Uses Firebase config in `src/client/app/firebase-config.ts`
- Production secrets managed via Firebase Secrets Manager

## Important Conventions

- **Component Selector Prefix**: Use `app-` prefix for all components
- **Strict TypeScript**: Strict mode enabled - no implicit `any`
- **Import Sorting**: ESLint enforces alphabetical imports (via `eslint-plugin-simple-import-sort`)
- **State Updates**: Always use Immer via the `produce()` function
- **Styling**: SCSS with shared variables in `src/client/styles/_variables.scss`
- **No Modules**: Only standalone components - do not create NgModules

## Scripts

- `scripts/start-dev-with-test-data.sh`: Starts emulators and populates test data
- `scripts/generate-test-data.js`: Generates mock vocabulary entries for testing
