# Set API key for Translate API

- Go to https://console.cloud.google.com/apis/credentials?project=linqua-cab88 and copy "Server key"
- Run `firebase functions:config:set translateapi.key="<copied-key>"`

# Setup local dev environment (test functions locally):

- `npm install -g firebase-tools`
- `npm install` in `src/functions` directory
- `firebase login`
- Make sure to set the Translate API key as describe above
- Run `firebase functions:config:get > .runtimeconfig.json` in `src/functions` directory
- Use Postman to execute HTTP requests against API (with `Authentication` header value taken from requests that browser makes after you login to the app)

# Setup CI

- Create `GOOGLE_APPLICATION_CREDENTIALS` secret in GitHub with contents of a service account that hase "Firebase Admin" role.
  - Service account can be set up here: https://console.cloud.google.com/iam-admin/serviceaccounts?authuser=0&hl=en&inv=1&invt=AbiVqQ&project=linqua-cab88

# Links

- [Environment Configuration](https://firebase.google.com/docs/functions/config-env)
- [Run Functions Locally](https://firebase.google.com/docs/functions/local-emulator)
