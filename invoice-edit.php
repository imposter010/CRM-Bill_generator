<?php
$page_title = "Edit Invoice";
$active_page = "invoices";
require_once __DIR__ . '/includes/header.php';

$db = getDB();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Fetch Invoice details
$stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?");
$stmt->execute([$id]);
$invoice = $stmt->fetch();

if (!$invoice) {
    $_SESSION['flash_danger'] = "Invoice not found!";
    header("Location: invoices.php");
    exit;
}

// Fetch line items
$itemsStmt = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sno ASC");
$itemsStmt->execute([$id]);
$items = $itemsStmt->fetchAll();

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $invoice_no = trim($_POST['invoice_no']);
    $invoice_date = trim($_POST['invoice_date']);
    $client_id = !empty($_POST['client_id']) ? (int)$_POST['client_id'] : null;
    $client_name = trim($_POST['client_name']);
    $client_address = trim($_POST['client_address']);
    $client_gstin = trim($_POST['client_gstin']);
    $client_phone = trim($_POST['client_phone']);
    $payment_method = trim($_POST['payment_method']);
    $lr_no = trim($_POST['lr_no']);
    $vehicle_no = trim($_POST['vehicle_no']);
    $place_of_supply = trim($_POST['place_of_supply']);
    $date_of_supply = trim($_POST['date_of_supply']);
    $reverse_charge = trim($_POST['reverse_charge']);
    
    // Numeric calculations
    $subtotal = (float)$_POST['subtotal'];
    $cgst_amount = (float)$_POST['cgst_amount'];
    $sgst_amount = (float)$_POST['sgst_amount'];
    $total_amount = (float)$_POST['total_amount'];
    $amount_in_words = trim($_POST['amount_in_words']);
    $status = trim($_POST['status']);
    
    if (empty($invoice_no)) {
        $_SESSION['flash_danger'] = "Invoice number is required!";
    } elseif (empty($client_name)) {
        $_SESSION['flash_danger'] = "Client name is required!";
    } else {
        try {
            $db->beginTransaction();
            
            // Check uniqueness of invoice number
            $checkStmt = $db->prepare("SELECT COUNT(*) FROM invoices WHERE invoice_no = ? AND id != ?");
            $checkStmt->execute([$invoice_no, $id]);
            if ($checkStmt->fetchColumn() > 0) {
                throw new Exception("Invoice number '{$invoice_no}' is already taken by another invoice.");
            }
            
            // Update invoices table
            $updateStmt = $db->prepare("UPDATE invoices SET 
                invoice_no = ?, invoice_date = ?, client_id = ?, client_name = ?, client_address = ?, client_gstin = ?, client_phone = ?,
                payment_method = ?, lr_no = ?, vehicle_no = ?, place_of_supply = ?, date_of_supply = ?, reverse_charge = ?,
                subtotal = ?, cgst_amount = ?, sgst_amount = ?, total_amount = ?, amount_in_words = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?");
            
            $updateStmt->execute([
                $invoice_no, $invoice_date, $client_id, $client_name, $client_address, $client_gstin, $client_phone,
                $payment_method, $lr_no, $vehicle_no, $place_of_supply, $date_of_supply, $reverse_charge,
                $subtotal, $cgst_amount, $sgst_amount, $total_amount, $amount_in_words, $status,
                $id
            ]);
            
            // Delete existing line items
            $delStmt = $db->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
            $delStmt->execute([$id]);
            
            // Insert updated items
            if (isset($_POST['items']) && is_array($_POST['items'])) {
                $sno = 1;
                $stmtItem = $db->prepare("INSERT INTO invoice_items (invoice_id, sno, particulars, hsn_code, quantity, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($_POST['items'] as $item) {
                    $particulars = trim($item['particulars']);
                    if (empty($particulars)) continue; // skip blank rows
                    
                    $hsn = trim($item['hsn_code']);
                    $qty = (float)$item['quantity'];
                    $rate = (float)$item['rate'];
                    $amount = $qty * $rate;
                    
                    $stmtItem->execute([$id, $sno, $particulars, $hsn, $qty, $rate, $amount]);
                    $sno++;
                }
            }
            
            $db->commit();
            $_SESSION['flash_success'] = "Invoice #{$invoice_no} updated successfully!";
            header("Location: invoices.php");
            exit;
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            $_SESSION['flash_danger'] = "Failed to update invoice: " . $e->getMessage();
            
            // Reload original state for display if failed
            $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmt->execute([$id]);
            $invoice = $stmt->fetch();
        }
    }
}

// Fetch all clients for the selector
$clients = $db->query("SELECT * FROM clients ORDER BY name ASC")->fetchAll();
?>

<form method="POST" action="invoice-edit.php?id=<?php echo $id; ?>" id="invoice-form">
    <div class="page-header">
        <h1 class="page-title">Edit Invoice #<?php echo htmlspecialchars($invoice['invoice_no']); ?></h1>
        <div class="actions-group">
            <a href="invoices.php" class="btn btn-outline">Cancel</a>
            <button type="submit" class="btn btn-primary">
                <i class="fa-solid fa-floppy-disk"></i> Update Invoice
            </button>
        </div>
    </div>

    <!-- 2-Column Metadata Grid -->
    <div class="invoice-layout" style="margin-bottom: 1.5rem;">
        
        <!-- Left Column: Invoice Parameters -->
        <div class="card">
            <h2 class="card-title">
                <span class="icon"><i class="fa-solid fa-receipt"></i></span> Invoice Details
            </h2>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="invoice_no">Invoice No.</label>
                    <input type="text" id="invoice_no" name="invoice_no" value="<?php echo htmlspecialchars($invoice['invoice_no']); ?>" required>
                </div>
                <div class="form-group">
                    <label for="invoice_date">Invoice Date</label>
                    <input type="date" id="invoice_date" name="invoice_date" value="<?php echo htmlspecialchars($invoice['invoice_date']); ?>" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payment_method">Payment Method</label>
                    <select id="payment_method" name="payment_method">
                        <option value="Cash" <?php echo $invoice['payment_method'] === 'Cash' ? 'selected' : ''; ?>>Cash</option>
                        <option value="Bank Transfer" <?php echo $invoice['payment_method'] === 'Bank Transfer' ? 'selected' : ''; ?>>Bank Transfer</option>
                        <option value="Cheque" <?php echo $invoice['payment_method'] === 'Cheque' ? 'selected' : ''; ?>>Cheque</option>
                        <option value="UPI" <?php echo $invoice['payment_method'] === 'UPI' ? 'selected' : ''; ?>>UPI</option>
                        <option value="Credit Card" <?php echo $invoice['payment_method'] === 'Credit Card' ? 'selected' : ''; ?>>Credit/Debit Card</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="draft" <?php echo $invoice['status'] === 'draft' ? 'selected' : ''; ?>>Draft</option>
                        <option value="sent" <?php echo $invoice['status'] === 'sent' ? 'selected' : ''; ?>>Sent</option>
                        <option value="paid" <?php echo $invoice['status'] === 'paid' ? 'selected' : ''; ?>>Paid</option>
                        <option value="cancelled" <?php echo $invoice['status'] === 'cancelled' ? 'selected' : ''; ?>>Cancelled</option>
                    </select>
                </div>
            </div>

            <div class="divider"></div>
            
            <h3 class="card-title" style="font-size: 0.95rem;">
                <span class="icon"><i class="fa-solid fa-truck"></i></span> Transportation & Supply
            </h3>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="lr_no">L.R. No.</label>
                    <input type="text" id="lr_no" name="lr_no" value="<?php echo htmlspecialchars($invoice['lr_no'] ?: ''); ?>" placeholder="e.g. 54321">
                </div>
                <div class="form-group">
                    <label for="vehicle_no">Vehicle No.</label>
                    <input type="text" id="vehicle_no" name="vehicle_no" value="<?php echo htmlspecialchars($invoice['vehicle_no'] ?: ''); ?>" placeholder="e.g. MP-09-AB-1234">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="place_of_supply">Place of Supply</label>
                    <input type="text" id="place_of_supply" name="place_of_supply" value="<?php echo htmlspecialchars($invoice['place_of_supply'] ?: ''); ?>" placeholder="e.g. Indore">
                </div>
                <div class="form-group">
                    <label for="date_of_supply">Date of Supply</label>
                    <input type="date" id="date_of_supply" name="date_of_supply" value="<?php echo htmlspecialchars($invoice['date_of_supply'] ?: ''); ?>">
                </div>
            </div>
            
            <div class="form-group">
                <label for="reverse_charge">Reverse Charge Applicable?</label>
                <select id="reverse_charge" name="reverse_charge">
                    <option value="No" <?php echo $invoice['reverse_charge'] === 'No' ? 'selected' : ''; ?>>No</option>
                    <option value="Yes" <?php echo $invoice['reverse_charge'] === 'Yes' ? 'selected' : ''; ?>>Yes</option>
                </select>
            </div>
        </div>

        <!-- Right Column: Client details -->
        <div class="card">
            <h2 class="card-title">
                <span class="icon"><i class="fa-solid fa-user-tie"></i></span> Client Details
            </h2>
            
            <div class="form-group">
                <label for="client_select">Select Registered Client</label>
                <select id="client_select" name="client_id" onchange="autofillClientDetails()">
                    <option value="">-- Choose Client (or enter manually) --</option>
                    <?php foreach ($clients as $c): ?>
                        <option value="<?php echo $c['id']; ?>" 
                                data-name="<?php echo htmlspecialchars($c['name']); ?>"
                                data-address="<?php echo htmlspecialchars($c['address']); ?>"
                                data-phone="<?php echo htmlspecialchars($c['phone']); ?>"
                                data-gstin="<?php echo htmlspecialchars($c['gstin']); ?>"
                                <?php echo $invoice['client_id'] == $c['id'] ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($c['name']); ?> (<?php echo htmlspecialchars($c['gstin'] ?: 'No GSTIN'); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="divider"></div>
            
            <div class="form-group">
                <label for="client_name">Client Billing Name</label>
                <input type="text" id="client_name" name="client_name" value="<?php echo htmlspecialchars($invoice['client_name']); ?>" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="client_gstin">Client GSTIN</label>
                    <input type="text" id="client_gstin" name="client_gstin" value="<?php echo htmlspecialchars($invoice['client_gstin'] ?: ''); ?>">
                </div>
                <div class="form-group">
                    <label for="client_phone">Client Mobile No.</label>
                    <input type="text" id="client_phone" name="client_phone" value="<?php echo htmlspecialchars($invoice['client_phone'] ?: ''); ?>" placeholder="Enter client mobile number">
                </div>
            </div>
            
            <div class="form-group">
                <label for="client_address">Client Billing Address</label>
                <textarea id="client_address" name="client_address" rows="5" required><?php echo htmlspecialchars($invoice['client_address']); ?></textarea>
            </div>
        </div>
    </div>

    <!-- Line Items Table -->
    <div class="card" style="margin-bottom: 2rem;">
        <h2 class="card-title">
            <span class="icon"><i class="fa-solid fa-list-ol"></i></span> Line Items (Tax Rate is CGST 9% + SGST 9%)
        </h2>
        
        <div class="table-wrapper">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%">S.No</th>
                        <th style="width: 45%">Particulars/Description of Goods</th>
                        <th style="width: 15%">HSN/SAC Code</th>
                        <th style="width: 10%">Quantity</th>
                        <th style="width: 12%">Rate (₹)</th>
                        <th style="width: 13%">Amount (₹)</th>
                        <th style="width: 5%"></th>
                    </tr>
                </thead>
                <tbody id="items-container">
                    <?php 
                    $rowIdx = 0;
                    foreach ($items as $item): 
                        $rowIdx++;
                    ?>
                    <tr>
                        <td class="row-sno"><?php echo $item['sno']; ?></td>
                        <td>
                            <input type="text" name="items[<?php echo $rowIdx; ?>][particulars]" class="item-particulars" required value="<?php echo htmlspecialchars($item['particulars']); ?>" placeholder="Particulars/Description of Goods">
                        </td>
                        <td>
                            <input type="text" name="items[<?php echo $rowIdx; ?>][hsn_code]" class="item-hsn" value="<?php echo htmlspecialchars($item['hsn_code']); ?>" placeholder="HSN Code">
                        </td>
                        <td>
                            <input type="number" step="any" name="items[<?php echo $rowIdx; ?>][quantity]" class="item-qty" required value="<?php echo $item['quantity']; ?>" style="text-align: center;">
                        </td>
                        <td>
                            <input type="number" step="0.01" name="items[<?php echo $rowIdx; ?>][rate]" class="item-rate" required value="<?php echo $item['rate']; ?>" style="text-align: right;">
                        </td>
                        <td>
                            <input type="number" step="0.01" class="item-amount" readonly value="<?php echo number_format($item['amount'], 2, '.', ''); ?>" style="text-align: right; background: rgba(255,255,255,0.02); border: none;">
                        </td>
                        <td>
                            <button type="button" class="btn btn-danger btn-icon delete-row-btn btn-sm" title="Remove Item">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 1rem;">
            <button type="button" class="btn btn-outline btn-sm" id="add-row-btn">
                <i class="fa-solid fa-plus"></i> Add Item Row
            </button>
        </div>
        
        <div class="divider"></div>
        
        <!-- Totals & Calculations -->
        <div class="totals-section">
            <!-- Words Representation -->
            <div class="form-group">
                <label for="amount_in_words">Amount in Words (INR)</label>
                <textarea id="amount_in_words" name="amount_in_words" rows="3" readonly placeholder="Calculated automatically..." style="background: rgba(255,255,255,0.02); color: var(--text-secondary);"><?php echo htmlspecialchars($invoice['amount_in_words']); ?></textarea>
            </div>
            
            <!-- Calculations Breakdown -->
            <div class="total-table">
                <div class="total-row">
                    <span class="label">Subtotal</span>
                    <span class="value" id="subtotal-display">₹<?php echo number_format($invoice['subtotal'], 2); ?></span>
                    <input type="hidden" name="subtotal" id="subtotal-input" value="<?php echo $invoice['subtotal']; ?>">
                </div>
                <div class="total-row">
                    <span class="label">CGST (9%)</span>
                    <span class="value" id="cgst-display">₹<?php echo number_format($invoice['cgst_amount'], 2); ?></span>
                    <input type="hidden" name="cgst_amount" id="cgst-input" value="<?php echo $invoice['cgst_amount']; ?>">
                </div>
                <div class="total-row">
                    <span class="label">SGST (9%)</span>
                    <span class="value" id="sgst-display">₹<?php echo number_format($invoice['sgst_amount'], 2); ?></span>
                    <input type="hidden" name="sgst_amount" id="sgst-input" value="<?php echo $invoice['sgst_amount']; ?>">
                </div>
                <div class="total-row highlight">
                    <span class="label">Grand Total</span>
                    <span class="value" id="total-display">₹<?php echo number_format($invoice['total_amount'], 2); ?></span>
                    <input type="hidden" name="total_amount" id="total-input" value="<?php echo $invoice['total_amount']; ?>">
                </div>
            </div>
        </div>
    </div>
</form>

<script>
let rowCounter = <?php echo $rowIdx; ?>;
const itemsContainer = document.getElementById('items-container');
const addRowBtn = document.getElementById('add-row-btn');

document.addEventListener('DOMContentLoaded', function() {
    // If table is completely empty, add an empty row
    if (rowCounter === 0) {
        addItemRow('', '', 1, 0);
    }
    
    // Bind dynamic recalculation
    itemsContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-rate')) {
            const row = e.target.closest('tr');
            calculateRowAmount(row);
            calculateInvoiceTotals();
        }
    });
    
    itemsContainer.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-row-btn');
        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            row.remove();
            reindexRows();
            calculateInvoiceTotals();
        }
    });
    
    addRowBtn.addEventListener('click', function() {
        addItemRow('', '', 1, 0);
    });
});

function autofillClientDetails() {
    const clientSelect = document.getElementById('client_select');
    const selectedOption = clientSelect.options[clientSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value !== "") {
        document.getElementById('client_name').value = selectedOption.getAttribute('data-name');
        document.getElementById('client_gstin').value = selectedOption.getAttribute('data-gstin') || '';
        document.getElementById('client_phone').value = selectedOption.getAttribute('data-phone') || '';
        document.getElementById('client_address').value = selectedOption.getAttribute('data-address') || '';
    }
}

function addItemRow(particulars = '', hsn = '', qty = 1, rate = 0) {
    rowCounter++;
    const rowHTML = `
    <tr>
        <td class="row-sno">1</td>
        <td>
            <input type="text" name="items[${rowCounter}][particulars]" class="item-particulars" required value="${particulars}" placeholder="Particulars/Description of Goods">
        </td>
        <td>
            <input type="text" name="items[${rowCounter}][hsn_code]" class="item-hsn" value="${hsn}" placeholder="HSN Code">
        </td>
        <td>
            <input type="number" step="any" name="items[${rowCounter}][quantity]" class="item-qty" required value="${qty}" style="text-align: center;">
        </td>
        <td>
            <input type="number" step="0.01" name="items[${rowCounter}][rate]" class="item-rate" required value="${rate}" style="text-align: right;">
        </td>
        <td>
            <input type="number" step="0.01" class="item-amount" readonly value="${(qty * rate).toFixed(2)}" style="text-align: right; background: rgba(255,255,255,0.02); border: none;">
        </td>
        <td>
            <button type="button" class="btn btn-danger btn-icon delete-row-btn btn-sm" title="Remove Item">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </td>
    </tr>`;
    
    itemsContainer.insertAdjacentHTML('beforeend', rowHTML);
    reindexRows();
    calculateInvoiceTotals();
}

function reindexRows() {
    const rows = itemsContainer.querySelectorAll('tr');
    let idx = 1;
    rows.forEach(row => {
        row.querySelector('.row-sno').textContent = idx;
        idx++;
    });
}

function calculateRowAmount(row) {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amountField = row.querySelector('.item-amount');
    amountField.value = (qty * rate).toFixed(2);
}

function calculateInvoiceTotals() {
    const rows = itemsContainer.querySelectorAll('tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        subtotal += qty * rate;
    });
    
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;
    
    document.getElementById('subtotal-display').textContent = formatCurrencyJS(subtotal);
    document.getElementById('subtotal-input').value = subtotal.toFixed(2);
    
    document.getElementById('cgst-display').textContent = formatCurrencyJS(cgst);
    document.getElementById('cgst-input').value = cgst.toFixed(2);
    
    document.getElementById('sgst-display').textContent = formatCurrencyJS(sgst);
    document.getElementById('sgst-input').value = sgst.toFixed(2);
    
    document.getElementById('total-display').textContent = formatCurrencyJS(total);
    document.getElementById('total-input').value = total.toFixed(2);
    
    document.getElementById('amount_in_words').value = numberToWordsINR(total);
}

function formatCurrencyJS(num) {
    num = parseFloat(num) || 0;
    let parts = num.toFixed(2).split('.');
    let integer = parts[0];
    let decimal = parts[1];
    
    let lastThree = integer.substring(integer.length - 3);
    let otherNumbers = integer.substring(0, integer.length - 3);
    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }
    let res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return '₹' + res + '.' + decimal;
}

function numberToWordsINR(num) {
    num = Math.round(num * 100) / 100;
    let parts = num.toString().split('.');
    let integer = parseInt(parts[0], 10);
    let decimal = parts[1] ? parseInt(parts[1], 10) : 0;
    
    if (isNaN(integer) || integer === 0) {
        if (decimal > 0) {
            if (parts[1].length === 1) decimal *= 10;
            return numberToWordsINR_helper(decimal) + " Paise Only";
        }
        return "Zero Rupees Only";
    }
    
    let words = numberToWordsINR_helper(integer) + " Rupees";
    if (decimal > 0) {
        if (parts[1].length === 1) decimal *= 10;
        words += " and " + numberToWordsINR_helper(decimal) + " Paise";
    }
    return words + " Only";
}

function numberToWordsINR_helper(num) {
    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const double = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    if (num === 0) return "";
    if (num < 20) return single[num];
    if (num < 100) return double[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + single[num % 10] : "");
    
    if (num < 1000) {
        return single[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + numberToWordsINR_helper(num % 100) : "");
    }
    
    if (num < 100000) {
        return numberToWordsINR_helper(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWordsINR_helper(num % 1000) : "");
    }
    
    if (num < 10000000) {
        return numberToWordsINR_helper(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWordsINR_helper(num % 100000) : "");
    }
    
    return numberToWordsINR_helper(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numberToWordsINR_helper(num % 10000000) : "");
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
