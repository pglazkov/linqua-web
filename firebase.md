# Setup local dev environment (test functions locally):

* `npm install -g firebase-tools`
* `yarn install` in `src/functions` directory
* `firebase login`
* Run `firebase serve --only functions,hosting`
* Use Postman to execute HTTP requests against API (with `Authentication` header value taken from requests that browser makes after you login to the app)

# Links

* [Environment Configuration](https://firebase.google.com/docs/functions/config-env)
* [Run Functions Locally](https://firebase.google.com/docs/functions/local-emulator)
