const admin = require('firebase-admin');

const dutchWords = [
  { original: 'huis', translation: 'house' },
  { original: 'vriendschap', translation: 'friendship' },
  { original: 'boterham', translation: 'sandwich' },
  { original: 'gezelligheid', translation: 'coziness' },
  { original: 'fiets', translation: 'bicycle' },
  { original: 'verjaardag', translation: 'birthday' },
  { original: 'ochtendgloren', translation: 'dawn' },
  { original: 'kat', translation: 'cat' },
  { original: 'boodschappen', translation: 'groceries' },
  { original: 'vogel', translation: 'bird' },
  { original: 'geschiedenis', translation: 'history' },
  { original: 'brood', translation: 'bread' },
  { original: 'verstandig', translation: 'sensible' },
  { original: 'melk', translation: 'milk' },
  { original: 'ontbijten', translation: 'to have breakfast' },
  { original: 'wandeling', translation: 'walk' },
  { original: 'spreekwoord', translation: 'proverb' },
  { original: 'slapen', translation: 'to sleep' },
  { original: 'buitenland', translation: 'foreign country' },
  { original: 'drinken', translation: 'to drink' },
  { original: 'natuurlijk', translation: 'naturally' },
  { original: 'klein', translation: 'small' },
  { original: 'verschillende', translation: 'different' },
  { original: 'schilderij', translation: 'painting' },
  { original: 'langzaam', translation: 'slow' },
  { original: 'gebeurtenis', translation: 'event' },
  { original: 'morgen', translation: 'tomorrow' },
  { original: 'gisteren', translation: 'yesterday' },
  { original: 'waarschijnlijk', translation: 'probably' },
  { original: 'maandelijks', translation: 'monthly' },
  { original: 'alstublieft', translation: 'please (formal)' },
  { original: 'bedankt', translation: 'thanks' },
  { original: 'tot ziens', translation: 'goodbye' },
  { original: 'goedemorgen', translation: 'good morning' },
  { original: 'supermarkt', translation: 'supermarket' },
  { original: 'ziekenhuis', translation: 'hospital' },
  { original: 'bibliotheek', translation: 'library' },
  { original: 'universiteit', translation: 'university' },
  { original: 'regenachtig', translation: 'rainy' },
  { original: 'zonneschijn', translation: 'sunshine' },
  { original: 'vergadering', translation: 'meeting' },
  { original: 'ontwikkeling', translation: 'development' }
];

const testAccount = {
  email: 'demo@linqua-app.com',
  password: 'p@ssw0rd'
};

function getRandomDate() {
  const now = Date.now();
  const periods = [
    { max: 1, weight: 4 },     // Today
    { max: 7, weight: 3 },     // Last week
    { max: 30, weight: 2 },    // Last month
    { max: 90, weight: 1 }     // Last 3 months
  ];

  // Create weighted array of max days
  const weightedPeriods = periods.flatMap(period => 
    Array(period.weight).fill(period.max)
  );

  // Pick random max days from weighted array
  const maxDays = weightedPeriods[Math.floor(Math.random() * weightedPeriods.length)];
  
  // Generate random date within the selected period
  const randomDays = Math.random() * maxDays;
  const randomHours = Math.random() * 24;
  const randomMinutes = Math.random() * 60;
  
  return now - (
    randomDays * 24 * 60 * 60 * 1000 +    // days to ms
    randomHours * 60 * 60 * 1000 +        // hours to ms
    randomMinutes * 60 * 1000             // minutes to ms
  );
}

async function generateTestData() {
  // Initialize Firebase Admin with emulator settings
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:5002';

  admin.initializeApp({
    projectId: 'linqua-cab88'
  });

  const auth = admin.auth();
  const db = admin.firestore();

  console.log('Creating demo user...');
  const userRecord = await auth.createUser({
    email: testAccount.email,
    password: testAccount.password,
    emailVerified: true
  });
  console.log(`Created demo user with email: ${testAccount.email}`);

  // Generate entries
  console.log('Generating test entries...');
  const userEntriesRef = db.collection('users').doc(userRecord.uid).collection('entries');

  for (let i = 0; i < dutchWords.length; i++) {
    const word = dutchWords[i];
    const entryId = `test-entry-${i + 1}`;
    const timestamp = getRandomDate();
    
    const entryData = {
      id: entryId,
      addedOn: timestamp,
      updatedOn: timestamp,
      originalText: word.original,
      translation: word.translation
    };

    try {
      await userEntriesRef.doc(entryId).set(entryData);
      console.log(`Added entry ${i + 1}/${dutchWords.length}: ${word.original} (${word.translation})`);
    } catch (error) {
      console.error(`Error adding entry ${i + 1}:`, error);
    }
  }

  console.log('\nTest data generation complete!');
  console.log('----------------------------------------');
  console.log('Demo Account Credentials:');
  console.log(`Email: ${testAccount.email}`);
  console.log(`Password: ${testAccount.password}`);
  console.log('----------------------------------------');
  console.log('\nThe development environment is now running.');
  console.log('Press Ctrl+C to stop all services and exit.');
}

generateTestData().catch(console.error); 