const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  sno: { type: Number, default: 1 },
  particulars: { type: String, required: true },
  hsnCode: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 }
});

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    invoiceDate: { type: String, required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    clientAddress: { type: String, default: '' },
    clientGstin: { type: String, default: '' },
    clientPhone: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    lrNo: { type: String, default: '' },
    vehicleNo: { type: String, default: '' },
    placeOfSupply: { type: String, default: '' },
    dateOfSupply: { type: String, default: '' },
    reverseCharge: { type: String, default: 'No' },
    subtotal: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    amountInWords: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled'],
      default: 'draft'
    },
    items: [InvoiceItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
