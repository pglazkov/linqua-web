import packageInfo from '../../../package.json';

export const environment = {
  production: false,
  useFirebaseEmulators: true,
  version: packageInfo.version,
  reCaptchaSiteKey: '6Lf4qpoqAAAAAHXc00LsnZIDw7tN8aCw__11MLye', // https://console.cloud.google.com/security/recaptcha?inv=1&invt=AbkFow&project=linqua-cab88&supportedpurview=project
};
