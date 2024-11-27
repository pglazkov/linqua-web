const admin = require('firebase-admin');

module.exports = (req, res) => {
  let batchSize = getBatchSizeFromUrl(req.url);

  admin
    .firestore()
    .collection('users')
    .doc(req.user.uid)
    .collection('entries')
    .get()
    .then(
      results => {
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

        res.status(200).json({ batch: Array.from(resultMap.values()) });
      },
      e => {
        res.status(500).json(e);
      },
    );
};

function getBatchSizeFromUrl(url) {
  const urlFragments = url.split('?');

  if (urlFragments.length <= 1) {
    return 1;
  }

  const searchParams = new URLSearchParams(urlFragments[1]);
  return searchParams['batch_size'] ? Number.parseInt(searchParams['batch_size']) : 1;
}
