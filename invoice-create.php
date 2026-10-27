<?php
$page_title = "Create Invoice";
$active_page = "invoices";
require_once __DIR__ . '/includes/header.php';

$db = getDB();

// Handle Invoice Submission
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
    $cgst_rate = 9.0;
    $sgst_rate = 9.0;
    $cgst_amount = (float)$_POST['cgst_amount'];
    $sgst_amount = (float)$_POST['sgst_amount'];
    $total_amount = (float)$_POST['total_amount'];
    $amount_in_words = trim($_POST['amount_in_words']);
    $status = trim($_POST['status']);
    
    if (empty($invoice_no)) {
        $_SESSION['flash_danger'] = "Invoice number is required!";
    } elseif (empty($client_name)) {
        $_SESSION['flash_danger'] = "Client selection or name is required!";
    } else {
        try {
            $db->beginTransaction();
            
            // Check if invoice number is already taken
            $checkStmt = $db->prepare("SELECT COUNT(*) FROM invoices WHERE invoice_no = ?");
            $checkStmt->execute([$invoice_no]);
            if ($checkStmt->fetchColumn() > 0) {
                throw new Exception("Invoice number '{$invoice_no}' already exists. Please choose a unique invoice number.");
            }
            
            // Insert into invoices
            $stmt = $db->prepare("INSERT INTO invoices (
                invoice_no, invoice_date, client_id, client_name, client_address, client_gstin, client_phone,
                payment_method, lr_no, vehicle_no, place_of_supply, date_of_supply, reverse_charge,
                subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount, total_amount, amount_in_words, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 9.0, 9.0, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $invoice_no, $invoice_date, $client_id, $client_name, $client_address, $client_gstin, $client_phone,
                $payment_method, $lr_no, $vehicle_no, $place_of_supply, $date_of_supply, $reverse_charge,
                $subtotal, $cgst_amount, $sgst_amount, $total_amount, $amount_in_words, $status
            ]);
            
            $invoice_id = $db->lastInsertId();
            
            // Insert line items
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
                    
                    $stmtItem->execute([$invoice_id, $sno, $particulars, $hsn, $qty, $rate, $amount]);
                    $sno++;
                }
            }
            
            $db->commit();
            $_SESSION['flash_success'] = "Invoice #{$invoice_no} created successfully!";
            header("Location: invoices.php");
            exit;
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            $_SESSION['flash_danger'] = "Failed to create invoice: " . $e->getMessage();
        }
    }
}

// Fetch all clients for the selector
$clients = $db->query("SELECT * FROM clients ORDER BY name ASC")->fetchAll();

// Suggest next invoice number
$max_id = $db->query("SELECT MAX(id) FROM invoices")->fetchColumn();
$suggested_no = 'INV-' . str_pad(($max_id + 1), 4, '0', STR_PAD_LEFT);
?>

<form method="POST" action="invoice-create.php" id="invoice-form">
    <div class="page-header">
        <h1 class="page-title">Create Tax Invoice</h1>
        <div class="actions-group">
            <a href="invoices.php" class="btn btn-outline">Cancel</a>
            <button type="submit" class="btn btn-success">
                <i class="fa-solid fa-cloud-arrow-up"></i> Save Invoice
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
                    <input type="text" id="invoice_no" name="invoice_no" value="<?php echo htmlspecialchars($suggested_no); ?>" required>
                </div>
                <div class="form-group">
                    <label for="invoice_date">Invoice Date</label>
                    <input type="date" id="invoice_date" name="invoice_date" value="<?php echo date('Y-m-d'); ?>" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payment_method">Payment Method</label>
                    <select id="payment_method" name="payment_method">
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer" selected>Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="UPI">UPI</option>
                        <option value="Credit Card">Credit/Debit Card</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="draft" selected>Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
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
                    <input type="text" id="lr_no" name="lr_no" placeholder="e.g. 54321">
                </div>
                <div class="form-group">
                    <label for="vehicle_no">Vehicle No.</label>
                    <input type="text" id="vehicle_no" name="vehicle_no" placeholder="e.g. MP-09-AB-1234">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="place_of_supply">Place of Supply</label>
                    <input type="text" id="place_of_supply" name="place_of_supply" placeholder="e.g. Indore">
                </div>
                <div class="form-group">
                    <label for="date_of_supply">Date of Supply</label>
                    <input type="date" id="date_of_supply" name="date_of_supply">
                </div>
            </div>
            
            <div class="form-group">
                <label for="reverse_charge">Reverse Charge Applicable?</label>
                <select id="reverse_charge" name="reverse_charge">
                    <option value="No" selected>No</option>
                    <option value="Yes">Yes</option>
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
                                data-gstin="<?php echo htmlspecialchars($c['gstin']); ?>">
                            <?php echo htmlspecialchars($c['name']); ?> (<?php echo htmlspecialchars($c['gstin'] ?: 'No GSTIN'); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
                <?php if (empty($clients)): ?>
                    <p style="font-size: 0.75rem; color: var(--warning); margin-top: 5px;">
                        <i class="fa-solid fa-triangle-exclamation"></i> No clients registered yet. 
                        <a href="clients.php" style="color: var(--accent-light);">Add one here first</a>.
                    </p>
                <?php endif; ?>
            </div>
            
            <div class="divider"></div>
            
            <div class="form-group">
                <label for="client_name">Client Billing Name</label>
                <input type="text" id="client_name" name="client_name" required placeholder="Select a client or enter client name">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="client_gstin">Client GSTIN</label>
                    <input type="text" id="client_gstin" name="client_gstin" placeholder="Enter client GSTIN (Optional)">
                </div>
                <div class="form-group">
                    <label for="client_phone">Client Mobile No.</label>
                    <input type="text" id="client_phone" name="client_phone" placeholder="Enter client mobile number">
                </div>
            </div>
            
            <div class="form-group">
                <label for="client_address">Client Billing Address</label>
                <textarea id="client_address" name="client_address" rows="5" required placeholder="Enter client billing address"></textarea>
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
                    <!-- Dynamic rows inserted here -->
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
                <textarea id="amount_in_words" name="amount_in_words" rows="3" readonly placeholder="Calculated automatically..." style="background: rgba(255,255,255,0.02); color: var(--text-secondary);"></textarea>
            </div>
            
            <!-- Calculations Breakdown -->
            <div class="total-table">
                <div class="total-row">
                    <span class="label">Subtotal</span>
                    <span class="value" id="subtotal-display">₹0.00</span>
                    <input type="hidden" name="subtotal" id="subtotal-input" value="0">
                </div>
                <div class="total-row">
                    <span class="label">CGST (9%)</span>
                    <span class="value" id="cgst-display">₹0.00</span>
                    <input type="hidden" name="cgst_amount" id="cgst-input" value="0">
                </div>
                <div class="total-row">
                    <span class="label">SGST (9%)</span>
                    <span class="value" id="sgst-display">₹0.00</span>
                    <input type="hidden" name="sgst_amount" id="sgst-input" value="0">
                </div>
                <div class="total-row highlight">
                    <span class="label">Grand Total</span>
                    <span class="value" id="total-display">₹0.00</span>
                    <input type="hidden" name="total_amount" id="total-input" value="0">
                </div>
            </div>
        </div>
    </div>
</form>

<script>
let rowCounter = 0;
const itemsContainer = document.getElementById('items-container');
const addRowBtn = document.getElementById('add-row-btn');

document.addEventListener('DOMContentLoaded', function() {
    // Add two default empty rows on start
    addItemRow('', '', 1, 0);
    addItemRow('', '', 1, 0);
    
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
            // pad if single digit e.g. .4 -> 40
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
