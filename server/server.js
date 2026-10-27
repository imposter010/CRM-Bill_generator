const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Company = require('./models/Company');
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bill_generator';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    // Ensure default company settings exist
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
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Company Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({});
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    let company = await Company.findOne();
    if (company) {
      Object.assign(company, req.body);
      await company.save();
    } else {
      company = await Company.create(req.body);
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clients Routes
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { id, _id, ...clientData } = req.body;
    let client;
    const clientId = _id || id;
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      client = await Client.findByIdAndUpdate(clientId, clientData, { new: true, upsert: true });
    } else {
      client = await Client.create(clientData);
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Check if client is linked to invoices
    const hasInvoices = await Invoice.exists({ clientId: id });
    if (hasInvoices) {
      return res.status(400).json({
        error: 'Cannot delete client. This client is associated with existing invoices!'
      });
    }
    await Client.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoices Routes
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ invoiceDate: -1, createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { id, _id, ...invData } = req.body;
    const invoiceId = _id || id;

    if (invoiceId && mongoose.Types.ObjectId.isValid(invoiceId)) {
      const updated = await Invoice.findByIdAndUpdate(invoiceId, invData, { new: true });
      return res.json(updated);
    }

    // Check duplicate invoice number
    const existing = await Invoice.findOne({ invoiceNo: invData.invoiceNo });
    if (existing) {
      return res.status(400).json({
        error: `Invoice number '${invData.invoiceNo}' already exists!`
      });
    }

    const newInvoice = await Invoice.create(invData);
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve compiled React Native Web frontend if dist exists
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Bill Generator API Server running on port ${PORT}`);
});
