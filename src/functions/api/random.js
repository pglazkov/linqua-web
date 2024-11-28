const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  try {
    let batchSize = getBatchSizeFromUrl(req.url);

    // prettier-ignore
    const results =
      await admin
        .firestore()
        .collection('users')
        .doc(req.user.uid)
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

    return res.status(200).json({ batch: Array.from(resultMap.values()) });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Unknown error occurred.');
  }
};

function getBatchSizeFromUrl(url) {
  const urlFragments = url.split('?');

  if (urlFragments.length <= 1) {
    return 1;
  }

  const searchParams = new URLSearchParams(urlFragments[1]);
  return searchParams.has('batch_size') ? Number.parseInt(searchParams.get('batch_size')) : 1;
}
