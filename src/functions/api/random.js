const functions = require('firebase-functions');
const admin = require('firebase-admin');

module.exports = (req, res) => {

  admin.firestore().collection('users')
    .doc(req.user.uid)
    .collection('entries')
    .get()
    .then(results => {
      const randomIndex = Math.floor(Math.random() * results.docs.length);
      const randomDoc = results.docs[randomIndex];

      const randomDocData = randomDoc.data();

      res.status(200).json({ id: randomDoc.id, data: randomDocData });
    }, e => {
      res.status(500).json(e);
    });
};
