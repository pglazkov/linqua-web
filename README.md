![CI Build](https://github.com/pglazkov/linqua-web/actions/workflows/main.yml/badge.svg)

# Linqua

A modern web application for learning foreign language vocabulary, built with Angular and Firebase.

## Features

- Create and maintain personal vocabulary lists with automatic English translations
- Track learning progress with learned/unlearned status for each word
- "Word of the Day" feature for spaced repetition learning
- Progress tracking and statistics
- Works offline (PWA)
- Real-time synchronization across devices
- Responsive design for both desktop and mobile

## Demo

![Demo Animation](demo.gif)

## Technical Implementation

#### Modern Angular Architecture
- Built with Angular 19 using standalone components
- Implements signals for reactive state management
- Change Detection Strategy OnPush for optimal performance

#### Progressive Web App (PWA)
- Full offline functionality with Service Workers
- Installable on desktop and mobile devices
- Automatic updates with version management
- Optimized asset caching strategy

#### Firebase Integration
- Real-time data synchronization with Firestore
- Secure authentication with multiple providers
- Cloud Functions for backend operations
- App Check integration for enhanced security
- Emulator support for local development

#### Testing & Quality
- Comprehensive unit test coverage
- End-to-end testing with Playwright
- Continuous Integration with GitHub Actions
- Strict TypeScript configuration
- ESLint and Prettier for code quality

#### User Experience
- Material Design components with Angular Material
- Responsive layout for all screen sizes
- Intuitive interface

## Technology Stack

- Frontend: Angular 19
- Backend: Firebase (Authentication, Firestore, Cloud Functions)
- Translation: Google Cloud Translate API
- PWA (Progressive Web App) for offline support
- CI/CD with GitHub Actions

## License

MIT © Pavlo Glazkov
