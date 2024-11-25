import packageInfo from '../../../package.json';

export const environment = {
  production: true,
  useFirebaseEmulators: false,
  version: packageInfo.version,
};
