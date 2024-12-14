// @ts-check
const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');

if (!admin.apps.length) {
  admin.initializeApp();
}

module.exports = onCall(async (req) => {
  let batchSize = req.data.batchSize;

  // prettier-ignore
  const results =
    await admin
      .firestore()
      .collection('users')
      .doc(req.auth.uid)
      .collection('entries')
      .get();

  const resultMap = new Map();

  batchSize = Math.min(batchSize, results.docs.length);

  while (resultMap.size < batchSize) {
    const randomIndex = Math.floor(Math.random() * results.docs.length);
    const randomDoc = results.docs[randomIndex];

    const randomDocData = randomDoc.data();

    if (!resultMap.has(randomDoc.id)) {
      resultMap.set(randomDoc.id, {
        id: randomDoc.id,
        data: randomDocData,
      });
    }
  }

  return { batch: Array.from(resultMap.values()) };
});
