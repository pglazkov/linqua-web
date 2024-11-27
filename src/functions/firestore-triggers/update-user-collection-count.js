const { onDocumentWritten } = require('firebase-functions/v2/firestore');

const admin = require('firebase-admin');

const db = admin.firestore();

// Creates a trigger on a given user collection and updates `<collectionName>-count`
// field on the user document after each update to the collection
module.exports = collectionName =>
  onDocumentWritten(`users/{userId}/${collectionName}/{itemId}`, event => {
    const isUpdate = event.data.after.exists && event.data.before.exists;

    if (isUpdate) {
      console.log('Skipping because it is an update operation (not addition or deletion).');
      return null;
    }

    const userRef = db.collection('users').doc(event.params.userId);

    return db.runTransaction(t => {
      return t.get(userRef).then(userDoc => {
        return userDoc.ref
          .collection(collectionName)
          .get()
          .then(collectionSnapshot => {
            const newCount = collectionSnapshot.size;

            const updateData = {};
            updateData[`${collectionName}-count`] = newCount;

            if (userDoc.exists) {
              t.update(userRef, updateData);
            } else {
              t.set(userRef, updateData);
            }

            console.log('Count updated successfully. New count is: ' + newCount);
          });
      });
    });
  });
