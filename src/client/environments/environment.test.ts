import packageInfo from '../../../package.json';

export const environment = {
  production: false,
  useFirebaseEmulators: true,
  version: packageInfo.version,
};
