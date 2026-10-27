# NA NATURAL AIR CONDITION® Bill Generator

A plug-and-play, beautiful, glassmorphic GST Tax Invoice and billing application designed for local execution. It requires **no server configuration** or complex installation.

---

## ⚡ Quick Start

### 🪟 Windows (Double-Click Run)
1. Double-click the file `start.bat` in this folder.
2. A command prompt will open, start the local server, and launch the application directly in your web browser.

### 🍎 macOS / 🐧 Linux (Terminal Run)
1. Open your terminal in this directory.
2. Run the shell script:
   ```bash
   ./start.sh
   ```
3. The server will spin up and open your default browser to the Dashboard instantly.

---

## 📋 Requirements
- **PHP 8.0 or higher**: The application runs on the built-in PHP development server.
- **SQLite3 Extension**: Configured automatically by default in standard PHP installations.

---

## 💾 Database & Backups
- The application uses a local, self-contained SQLite database stored at **`data/bill_generator.db`**.
- To make a full backup of all your invoices, settings, and clients, simply **copy the `data/` folder** to a safe location. To restore, copy it back!
