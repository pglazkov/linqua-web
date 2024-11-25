import packageInfo from '../../../package.json';

export const environment = {
  production: false,
  useFirebaseEmulators: false, // Set it to false to prevent the app code setting up the connection to the emulators, instead the test code will control this
  version: packageInfo.version,
};
