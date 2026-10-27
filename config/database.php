<?php
// Database configuration
define('DB_PATH', __DIR__ . '/../data/bill_generator.db');

function getDB() {
    static $db = null;
    if ($db === null) {
        $dbDir = dirname(DB_PATH);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
        $db = new PDO('sqlite:' . DB_PATH);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        initDatabase($db);
    }
    return $db;
}

function initDatabase($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        gstin TEXT,
        state TEXT,
        bank_name TEXT,
        branch TEXT,
        account_no TEXT,
        ifsc_code TEXT,
        terms TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        gstin TEXT,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE NOT NULL,
        invoice_date TEXT NOT NULL,
        client_id INTEGER,
        client_name TEXT NOT NULL,
        client_address TEXT,
        client_gstin TEXT,
        client_phone TEXT,
        payment_method TEXT,
        lr_no TEXT,
        vehicle_no TEXT,
        place_of_supply TEXT,
        date_of_supply TEXT,
        reverse_charge TEXT DEFAULT 'No',
        subtotal REAL DEFAULT 0,
        cgst_rate REAL DEFAULT 9,
        sgst_rate REAL DEFAULT 9,
        cgst_amount REAL DEFAULT 0,
        sgst_amount REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        amount_in_words TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES clients(id)
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        sno INTEGER,
        particulars TEXT NOT NULL,
        hsn_code TEXT,
        quantity REAL DEFAULT 1,
        rate REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )");

    // Run dynamic self-healing schema migration
    $cols = $db->query("PRAGMA table_info(invoices)")->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('client_phone', $cols)) {
        $db->exec("ALTER TABLE invoices ADD COLUMN client_phone TEXT");
    }

    // Insert default company settings if not exists
    $count = $db->query("SELECT COUNT(*) FROM company_settings")->fetchColumn();
    if ($count == 0) {
        $db->exec("INSERT INTO company_settings (name, address, phone, email, gstin, state, bank_name, branch, account_no, ifsc_code, terms)
            VALUES ('NA NATURAL AIR CONDITION', '39/2 Narsingh Bazar Indore', '9111303654', 'arshanahma@gmail.com', '23AORPA7441L1ZR', 'STATE 23 Madhya Parades', 'UCO BANK', 'BALVINAYMANDER INDORE', '19950110059142', 'UCBA0001995', 'Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E.')");
    }
}
?>
