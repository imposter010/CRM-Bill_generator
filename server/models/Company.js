const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'NA NATURAL AIR CONDITION' },
    address: { type: String, default: '39/2 Narsingh Bazar Indore' },
    phone: { type: String, default: '9111303654' },
    email: { type: String, default: 'arshanahma@gmail.com' },
    gstin: { type: String, default: '23AORPA7441L1ZR' },
    state: { type: String, default: 'STATE 23 Madhya Pradesh' },
    bankName: { type: String, default: 'UCO BANK' },
    branch: { type: String, default: 'BALVINAYMANDER INDORE' },
    accountNo: { type: String, default: '19950110059142' },
    ifscCode: { type: String, default: 'UCBA0001995' },
    terms: {
      type: String,
      default:
        'Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E.'
    },
    defaultCgstRate: { type: Number, default: 9 },
    defaultSgstRate: { type: Number, default: 9 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', CompanySchema);
