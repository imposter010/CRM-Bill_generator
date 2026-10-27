<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$db = getDB();

// Fetch Invoice details with client settings fallback for phone number
$stmt = $db->prepare("SELECT invoices.*, clients.phone AS client_saved_phone 
                      FROM invoices 
                      LEFT JOIN clients ON invoices.client_id = clients.id 
                      WHERE invoices.id = ?");
$stmt->execute([$id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    echo "<h1>Invoice not found!</h1><p><a href='invoices.php'>Go back to invoices</a></p>";
    exit;
}

// Fallback to customer's saved settings phone if invoice phone is empty
$invoice['client_phone'] = !empty($invoice['client_phone']) ? $invoice['client_phone'] : ($invoice['client_saved_phone'] ?? '');

// Fetch line items
$itemsStmt = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sno ASC");
$itemsStmt->execute([$id]);
$items = $itemsStmt->fetchAll();

// Fetch company details
$company = $db->query("SELECT * FROM company_settings LIMIT 1")->fetch();
if (!$company) {
    $company = [
        'name' => 'NA NATURAL AIR CONDITION',
        'address' => '39/2 Narsingh Bazar Indore',
        'phone' => '9111303654',
        'email' => 'arshanahma@gmail.com',
        'gstin' => '23AORPA7441L1ZR',
        'state' => 'STATE 23 Madhya Parades',
        'bank_name' => 'UCO BANK',
        'branch' => 'BALVINAYMANDER INDORE',
        'account_no' => '19950110059142',
        'ifsc_code' => 'UCBA0001995',
        'terms' => "Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E."
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - <?php echo htmlspecialchars($invoice['invoice_no']); ?></title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #1a237e;
            --text-dark: #111111;
            --text-muted: #555555;
            --border-color: #dddddd;
            --bg-light: #f9f9f9;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
            background: #f0f2f5;
            color: var(--text-dark);
            line-height: 1.4;
            padding: 2rem 1rem;
        }
        
        /* Control Panel (Screen Only) */
        .control-panel {
            max-width: 900px;
            margin: 0 auto 1.5rem auto;
            background: #ffffff;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        
        .control-panel .btn-group {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s ease;
        }
        
        .btn-back {
            background: #ffffff;
            border-color: var(--border-color);
            color: var(--text-muted);
        }
        .btn-back:hover {
            background: var(--bg-light);
            color: var(--text-dark);
        }
        
        .btn-print {
            background: var(--primary-color);
            color: #ffffff;
        }
        .btn-print:hover {
            background: #0d0f3c;
        }
        
        .btn-edit {
            background: #ff6f00;
            color: #ffffff;
        }
        .btn-edit:hover {
            background: #e65100;
        }
        
        /* Print Page (Paper Style) */
        .print-page {
            background: #ffffff;
            max-width: 900px;
            margin: 0 auto;
            padding: 2.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden; /* Prevent watermark from causing scrolls */
        }
        
        /* Watermark style */
        .watermark {
            position: absolute;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 3.8rem;
            font-weight: 800;
            color: rgba(26, 35, 126, 0.04); /* Faint primary color */
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
            z-index: 0;
            text-transform: uppercase;
        }
        
        .invoice-title {
            text-align: center;
            font-size: 1.6rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1.5rem;
            color: #000000;
            border-bottom: 2px solid #000000;
            padding-bottom: 0.25rem;
        }
        
        /* Grid Details */
        .details-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            border: 1px solid var(--border-color);
            margin-bottom: 1.5rem;
        }
        
        .grid-cell {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .grid-cell:nth-child(odd) {
            border-right: 1px solid var(--border-color);
        }
        
        .grid-cell.span-two-rows {
            grid-row: span 2;
        }
        
        .grid-cell.full-width {
            grid-column: span 2;
            border-right: none;
        }
        
        .grid-cell:last-child {
            border-bottom: none;
        }
        
        .section-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 0.4rem;
            display: block;
        }
        
        /* Items Table */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
        }
        
        .invoice-table th, .invoice-table td {
            border: 1px solid var(--border-color);
            padding: 0.6rem 0.8rem;
            font-size: 0.85rem;
        }
        
        .invoice-table th {
            background: var(--bg-light);
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            font-size: 0.78rem;
            color: var(--text-dark);
        }
        
        .invoice-table td.text-left { text-align: left; }
        .invoice-table td.text-center { text-align: center; }
        .invoice-table td.text-right { text-align: right; }
        
        /* Totals Block */
        .totals-block {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            border: 1px solid var(--border-color);
            margin-bottom: 1.5rem;
        }
        
        .totals-left-cell {
            padding: 0.75rem 1rem;
            border-right: 1px solid var(--border-color);
        }
        
        .totals-right-cell {
            background: #ffffff;
        }
        
        .calc-row {
            display: flex;
            justify-content: space-between;
            padding: 0.45rem 1rem;
            font-size: 0.85rem;
            border-bottom: 1px solid #eeeeee;
        }
        
        .calc-row:last-child {
            border-bottom: none;
            background: var(--bg-light);
            font-weight: 700;
            font-size: 0.95rem;
            border-top: 1px solid var(--border-color);
        }
        
        /* Details and terms */
        .terms-bank-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 1.5rem;
            margin-top: 1.5rem;
            border-top: 1px solid var(--border-color);
            padding-top: 1.25rem;
        }
        
        .block-title {
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
            color: var(--text-dark);
        }
        
        .bank-details-list {
            list-style: none;
            font-size: 0.8rem;
        }
        .bank-details-list li {
            margin-bottom: 0.25rem;
        }
        .bank-details-list span {
            font-weight: 600;
            display: inline-block;
            width: 100px;
        }
        
        .terms-text {
            font-size: 0.78rem;
            color: var(--text-muted);
            white-space: pre-wrap;
        }
        
        /* Signatures block */
        .signatures-section {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            margin-top: 4rem;
            align-items: flex-end;
        }
        
        .sig-box {
            text-align: center;
        }
        
        .sig-line {
            width: 180px;
            margin: 0 auto 0.4rem auto;
            border-top: 1px dashed var(--text-muted);
        }
        
        .sig-label {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-muted);
        }
        
        /* Print Styles */
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            
            .control-panel {
                display: none !important;
            }
            
            .print-page {
                box-shadow: none;
                border-radius: 0;
                padding: 0;
                margin: 0;
                max-width: 100%;
            }
            
            /* Ensure colors print correctly */
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>

    <!-- Control Panel (Screen Only) -->
    <div class="control-panel no-print">
        <a href="invoices.php" class="btn btn-back">
            <i class="fa-solid fa-arrow-left"></i> Back to Invoices
        </a>
        <div class="btn-group">
            <button onclick="sendWhatsApp('<?php echo htmlspecialchars($invoice['client_phone'] ?: ''); ?>', '<?php echo htmlspecialchars($invoice['client_name']); ?>', '<?php echo htmlspecialchars($invoice['invoice_no']); ?>', '<?php echo number_format($invoice['total_amount'], 2); ?>', '<?php echo formatDate($invoice['invoice_date']); ?>')" class="btn btn-whatsapp" style="background: #25D366; color: white;">
                <i class="fa-brands fa-whatsapp"></i> WhatsApp Buyer
            </button>
            <a href="invoice-edit.php?id=<?php echo $id; ?>" class="btn btn-edit">
                <i class="fa-solid fa-pen-to-square"></i> Edit Invoice
            </a>
            <button onclick="window.print()" class="btn btn-print">
                <i class="fa-solid fa-print"></i> Print / Save PDF
            </button>
        </div>
    </div>

    <!-- Print Page Template -->
    <div class="print-page">
        <div class="watermark"><?php echo htmlspecialchars($company['name']); ?>®</div>
        <div class="invoice-title">Tax Invoice</div>
        
        <div class="details-grid">
            <!-- Issuer Details -->
            <div class="grid-cell span-two-rows">
                <span class="section-label">Billed By (Seller)</span>
                <div style="font-size: 1.15rem; font-weight: 800; color: #000; margin-bottom: 0.3rem;">
                    <?php echo htmlspecialchars($company['name']); ?>®
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); white-space: pre-wrap; margin-bottom: 0.4rem;"><?php echo htmlspecialchars($company['address']); ?></div>
                <div style="font-size: 0.82rem;"><strong>Phone:</strong> <?php echo htmlspecialchars($company['phone']); ?></div>
                <div style="font-size: 0.82rem;"><strong>Email:</strong> <?php echo htmlspecialchars($company['email']); ?></div>
                <div style="margin-top: 0.6rem; font-size: 0.85rem;"><strong>GSTIN:</strong> <?php echo htmlspecialchars($company['gstin']); ?></div>
                <div style="font-size: 0.85rem;"><strong>State:</strong> <?php echo htmlspecialchars($company['state']); ?></div>
            </div>
            
            <!-- Invoice Meta Part 1 -->
            <div class="grid-cell">
                <span class="section-label">Invoice Information</span>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600; width: 45%;">Invoice No:</td>
                        <td style="padding: 2px 0; font-family: monospace; font-weight: 700; font-size: 0.9rem;"><?php echo htmlspecialchars($invoice['invoice_no']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600;">Invoice Date:</td>
                        <td style="padding: 2px 0;"><?php echo formatDate($invoice['invoice_date']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600;">L.R. No:</td>
                        <td style="padding: 2px 0;"><?php echo htmlspecialchars($invoice['lr_no'] ?: '-'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600;">Vehicle No:</td>
                        <td style="padding: 2px 0;"><?php echo htmlspecialchars($invoice['vehicle_no'] ?: '-'); ?></td>
                    </tr>
                </table>
            </div>
            
            <!-- Invoice Meta Part 2 -->
            <div class="grid-cell">
                <span class="section-label">Supply & Logistics</span>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600; width: 45%;">Place of Supply:</td>
                        <td style="padding: 2px 0;"><?php echo htmlspecialchars($invoice['place_of_supply'] ?: '-'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600;">Date of Supply:</td>
                        <td style="padding: 2px 0;"><?php echo formatDate($invoice['date_of_supply']); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600;">Payment Mode:</td>
                        <td style="padding: 2px 0;"><?php echo htmlspecialchars($invoice['payment_method'] ?: 'Bank'); ?></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; font-weight: 600;">Reverse Charge:</td>
                        <td style="padding: 2px 0;"><?php echo htmlspecialchars($invoice['reverse_charge'] ?: 'No'); ?></td>
                    </tr>
                </table>
            </div>
            
            <!-- Client Details (Billed To) -->
            <div class="grid-cell full-width">
                <span class="section-label">Billed To (Buyer)</span>
                <div style="font-size: 1.05rem; font-weight: 700; color: #000; margin-bottom: 0.2rem;">
                    <?php echo htmlspecialchars($invoice['client_name']); ?>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); white-space: pre-wrap;"><?php echo htmlspecialchars($invoice['client_address']); ?></div>
                <?php if (!empty($invoice['client_phone'])): ?>
                    <div style="margin-top: 0.25rem; font-size: 0.85rem;">
                        <strong>Mobile No:</strong> <?php echo htmlspecialchars($invoice['client_phone']); ?>
                    </div>
                <?php endif; ?>
                <?php if (!empty($invoice['client_gstin'])): ?>
                    <div style="margin-top: 0.25rem; font-size: 0.85rem;">
                        <strong>GSTIN:</strong> <?php echo htmlspecialchars($invoice['client_gstin']); ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Table of Line Items -->
        <table class="invoice-table">
            <thead>
                <tr>
                    <th style="width: 7%">S.No</th>
                    <th style="width: 48%">Description of Goods / Services</th>
                    <th style="width: 15%">HSN/SAC</th>
                    <th style="width: 10%">Qty</th>
                    <th style="width: 10%">Rate (₹)</th>
                    <th style="width: 10%">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $item): ?>
                    <tr>
                        <td class="text-center"><?php echo $item['sno']; ?></td>
                        <td class="text-left" style="font-weight: 500;"><?php echo htmlspecialchars($item['particulars']); ?></td>
                        <td class="text-center"><?php echo htmlspecialchars($item['hsn_code'] ?: '-'); ?></td>
                        <td class="text-center"><?php echo $item['quantity']; ?></td>
                        <td class="text-right"><?php echo number_format($item['rate'], 2); ?></td>
                        <td class="text-right"><?php echo number_format($item['amount'], 2); ?></td>
                    </tr>
                <?php endforeach; ?>
                <!-- Padding empty rows to balance invoice height -->
                <?php 
                $padCount = 6 - count($items);
                if ($padCount > 0):
                    for ($i = 0; $i < $padCount; $i++):
                ?>
                    <tr>
                        <td class="text-center" style="color: transparent;"><?php echo count($items) + $i + 1; ?></td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                <?php 
                    endfor;
                endif; 
                ?>
            </tbody>
        </table>
        
        <!-- Totals and Words -->
        <div class="totals-block">
            <div class="totals-left-cell">
                <span class="section-label">Amount in Words</span>
                <div style="font-size: 0.85rem; font-weight: 700; color: #000; margin-top: 0.2rem;">
                    <?php echo htmlspecialchars($invoice['amount_in_words']); ?>
                </div>
            </div>
            <div class="totals-right-cell">
                <div class="calc-row">
                    <span style="color: var(--text-muted);">Subtotal</span>
                    <span style="font-weight: 500;"><?php echo number_format($invoice['subtotal'], 2); ?></span>
                </div>
                <div class="calc-row">
                    <span style="color: var(--text-muted);">CGST @ 9%</span>
                    <span><?php echo number_format($invoice['cgst_amount'], 2); ?></span>
                </div>
                <div class="calc-row">
                    <span style="color: var(--text-muted);">SGST @ 9%</span>
                    <span><?php echo number_format($invoice['sgst_amount'], 2); ?></span>
                </div>
                <div class="calc-row">
                    <span>Grand Total</span>
                    <span><?php echo number_format($invoice['total_amount'], 2); ?></span>
                </div>
            </div>
        </div>
        
        <!-- Bank Details and Terms & Conditions -->
        <div class="terms-bank-grid">
            <div>
                <div class="block-title">Terms &amp; Conditions</div>
                <div class="terms-text"><?php echo htmlspecialchars($company['terms']); ?></div>
            </div>
            
            <div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem;">
                <div class="block-title">Our Bank Account Details</div>
                <ul class="bank-details-list">
                    <li><span>Bank Name:</span> <?php echo htmlspecialchars($company['bank_name']); ?></li>
                    <li><span>Branch Name:</span> <?php echo htmlspecialchars($company['branch']); ?></li>
                    <li><span>Account No:</span> <?php echo htmlspecialchars($company['account_no']); ?></li>
                    <li><span>IFSC Code:</span> <?php echo htmlspecialchars($company['ifsc_code']); ?></li>
                </ul>
            </div>
        </div>
        
        <!-- Signatures Block -->
        <div class="signatures-section">
            <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-label">Receiver's Signature &amp; Stamp</div>
            </div>
            <div class="sig-box" style="text-align: right;">
                <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: #000; margin-bottom: 2.5rem;">
                    For <?php echo htmlspecialchars($company['name']); ?>®
                </div>
                <div class="sig-line" style="margin-right: 0; margin-left: auto;"></div>
                <div class="sig-label">Authorized Signatory</div>
            </div>
        </div>
    </div>

    <!-- Automatically print if requested in URL parameter -->
    <?php if (isset($_GET['print']) && $_GET['print'] === '1'): ?>
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            };
        </script>
    <?php endif; ?>

    <script>
    function sendWhatsApp(phone, clientName, invoiceNo, totalAmount, dateStr) {
        if (!phone || phone.trim() === '') {
            alert('Buyer mobile number is not registered for this invoice! Please update the invoice or client settings.');
            return;
        }
        
        // Clean phone number (remove spaces, dashes, +, etc.)
        let cleanPhone = phone.replace(/\D/g, '');
        
        // If it starts with 0, remove it
        if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1);
        }
        
        // If it's a 10-digit number, prepend 91 (India)
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }
        
        // Pre-compose the message
        const currentUrl = window.location.origin + '/print.php?id=<?php echo $id; ?>';
        const message = `Dear *${clientName}*,\n\nPlease find your Invoice *#${invoiceNo}* dated *${dateStr}* for the amount of *₹${totalAmount}* from *NA NATURAL AIR CONDITION®*.\n\nYou can view and download your tax invoice PDF here: ${currentUrl}\n\nThank you!`;
        
        // Encode message
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        if (confirm(`We are opening WhatsApp to send the invoice link to ${clientName}.\n\n💡 Tip: To share the actual PDF file, first click 'Print / Save PDF' to download the PDF, then attach it manually in the WhatsApp chat.`)) {
            window.open(whatsappUrl, '_blank');
        }
    }
    </script>

</body>
</html>
