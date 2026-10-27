# NA NATURAL AIR CONDITION® CRM Bill Generator

A modern, cross-platform **React Native & Expo** GST Tax Invoice and Billing application designed for mobile (iOS, Android) and Desktop / Web.

---

## ⚡ Quick Start

### 🌐 Web / Desktop
Run the start script or standard npm command:

- **macOS / Linux**:
  ```bash
  ./start.sh
  ```
  *or*
  ```bash
  npm run web
  ```

- **Windows**:
  Double-click `start.bat` or run:
  ```cmd
  npm run web
  ```

### 📱 Mobile (iOS & Android)
Start Expo and scan the QR code with **Expo Go** on your device, or run directly on simulators:
```bash
# Android emulator / connected device:
npm run android

# iOS simulator:
npm run ios
```

---

## ✨ Features

- **Dashboard**:
  - Live revenue analytics: Total Billed, Realized Collections, Pending Collections, Total Invoices count.
  - Quick actions and recent invoices timeline.

- **GST Tax Invoice Generator**:
  - Auto-incrementing invoice numbering (e.g. `INV-0001`).
  - Dynamic line items (Description, HSN/SAC code, Quantity, Rate, auto-computed Amount).
  - Indian GST Tax calculation (CGST 9% + SGST 9% = 18%).
  - Automatic Indian Numbering System words conversion (`Two Thousand One Hundred and Ninety Four Rupees and Eighty Paise Only`).
  - Status management (`Draft`, `Sent`, `Paid`, `Cancelled`).

- **Tax Invoice Printing & PDF Sharing**:
  - Original GST Tax Invoice layout preview.
  - One-click **Print** dialog.
  - Direct **PDF Export & Share** via WhatsApp, Email, AirDrop, or download.

- **Client Directory**:
  - Client billing records (Name, GSTIN, Phone, Email, Billing Address).
  - Quick-select client in invoice creator with auto-fill.
  - Per-client invoicing history and billing stats.

- **Company & Bank Settings**:
  - Issuer company information, state code, GSTIN.
  - Bank account details (Bank name, branch, account number, IFSC code).
  - Customizable Terms & Conditions.
  - Database Backup & Restore (JSON Export / Import).

---

## 🛠️ Tech Stack

- **Framework**: React Native & Expo SDK 58
- **Language**: TypeScript
- **State & Storage**: AsyncStorage (cross-platform offline storage)
- **Printing / PDF**: `expo-print` & `expo-sharing`
- **Icons**: `@expo/vector-icons` (Ionicons)
