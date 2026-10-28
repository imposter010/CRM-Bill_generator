const mongoose = require('mongoose');
const User = require('../server/models/User');
const Company = require('../server/models/Company');

const uri =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  'mongodb://127.0.0.1:27017/bill_generator';

async function seed() {
  console.log(`⏳ Connecting to MongoDB at: ${uri.replace(/:([^:@]{3,})@/, ':****@')}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB successfully!');

    // Upsert aarshan and arshan
    const users = [
      { username: 'aarshan', password: 'Arshan@ahmed' },
      { username: 'arshan', password: 'Arshan@ahmed' }
    ];

    for (const u of users) {
      const res = await User.findOneAndUpdate(
        { username: u.username },
        { username: u.username, password: u.password },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`👤 User ready: Username = "${res.username}", Password = "${res.password}"`);
    }

    // Default company profile
    const count = await Company.countDocuments();
    if (count === 0) {
      await Company.create({
        name: 'NA NATURAL AIR CONDITION',
        address: '39/2 Narsingh Bazar Indore',
        phone: '9111303654',
        email: 'arshanahma@gmail.com',
        gstin: '23AORPA7441L1ZR',
        state: 'STATE 23 Madhya Pradesh',
        bankName: 'UCO BANK',
        branch: 'BALVINAYMANDER INDORE',
        accountNo: '19950110059142',
        ifscCode: 'UCBA0001995',
        terms:
          'Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E.',
        defaultCgstRate: 9,
        defaultSgstRate: 9
      });
      console.log('🏢 Default company profile initialized');
    }

    console.log('\n🎉 Setup complete! All credentials and initial data ready in MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

seed();
