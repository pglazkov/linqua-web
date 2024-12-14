// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import packageInfo from '../../../package.json';

export const environment = {
  production: false,
  useFirebaseEmulators: true,
  version: packageInfo.version,
  reCaptchaSiteKey: '6Lf4qpoqAAAAAHXc00LsnZIDw7tN8aCw__11MLye', // https://console.cloud.google.com/security/recaptcha?inv=1&invt=AbkFow&project=linqua-cab88&supportedpurview=project
};
