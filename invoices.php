<?php
$page_title = "Invoices";
$active_page = "invoices";
require_once __DIR__ . '/includes/header.php';

$db = getDB();

// Handle Quick Status Update
if (isset($_GET['update_status']) && isset($_GET['status'])) {
    $id = (int)$_GET['update_status'];
    $status = trim($_GET['status']);
    
    if (in_array($status, ['draft', 'sent', 'paid', 'cancelled'])) {
        try {
            $stmt = $db->prepare("UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$status, $id]);
            $_SESSION['flash_success'] = "Invoice status updated to '" . ucfirst($status) . "' successfully!";
            header("Location: invoices.php");
            exit;
        } catch (Exception $e) {
            $_SESSION['flash_danger'] = "Failed to update status: " . $e->getMessage();
        }
    }
}

// Fetch Invoices with client saved phone fallback
$invoices = $db->query("SELECT invoices.*, clients.phone AS client_saved_phone 
                        FROM invoices 
                        LEFT JOIN clients ON invoices.client_id = clients.id 
                        ORDER BY invoices.invoice_date DESC, invoices.id DESC")->fetchAll();
?>

<div class="page-header">
    <h1 class="page-title">Tax Invoices</h1>
    <a href="invoice-create.php" class="btn btn-primary">
        <i class="fa-solid fa-file-signature"></i> Create New Invoice
    </a>
</div>

<!-- Search & Filtering Bar -->
<div class="filter-bar card">
    <div class="search-input">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="invoice-search" placeholder="Search invoices by invoice number, client name...">
    </div>
    <div style="min-width: 180px;">
        <select id="status-filter">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
        </select>
    </div>
</div>

<!-- Invoices Table -->
<div class="card" style="margin-top: 1.5rem;">
    <?php if (empty($invoices)): ?>
        <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            <p>No invoices found. Click the button above to create your first tax invoice.</p>
        </div>
    <?php else: ?>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%">Invoice No</th>
                        <th style="width: 12%">Date</th>
                        <th style="width: 25%">Client Name</th>
                        <th style="width: 15%; text-align: right;">Subtotal</th>
                        <th style="width: 13%; text-align: right;">Total Amount</th>
                        <th style="width: 10%; text-align: center;">Status</th>
                        <th style="width: 15%; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="invoices-table-body">
                    <?php foreach ($invoices as $inv): 
                        $total_tax = $inv['cgst_amount'] + $inv['sgst_amount'];
                        ?>
                        <tr data-status="<?php echo $inv['status']; ?>">
                            <td style="font-weight: 700; font-family: monospace;">
                                <?php echo htmlspecialchars($inv['invoice_no']); ?>
                            </td>
                            <td><?php echo formatDate($inv['invoice_date']); ?></td>
                            <td>
                                <div style="font-weight: 600;"><?php echo htmlspecialchars($inv['client_name']); ?></div>
                                <?php if (!empty($inv['client_gstin'])): ?>
                                    <div style="font-size: 0.72rem; color: var(--text-secondary); font-family: monospace;">
                                        GSTIN: <?php echo htmlspecialchars($inv['client_gstin']); ?>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td style="text-align: right;"><?php echo formatCurrency($inv['subtotal']); ?></td>
                            <td style="text-align: right; font-weight: 700; color: var(--accent-light);">
                                <?php echo formatCurrency($inv['total_amount']); ?>
                            </td>
                            <td style="text-align: center;">
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                    <!-- Badge -->
                                    <span class="badge badge-<?php echo $inv['status']; ?>">
                                        <?php echo ucfirst($inv['status']); ?>
                                    </span>
                                    
                                    <!-- Status Switcher Dropdown -->
                                    <select class="no-print" onchange="changeStatus(<?php echo $inv['id']; ?>, this.value)" style="font-size: 0.7rem; padding: 0.1rem 0.25rem; border-radius: 4px; width: auto; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); color: var(--text-secondary); cursor: pointer;">
                                        <option value="draft" <?php echo $inv['status'] === 'draft' ? 'selected' : ''; ?>>Draft</option>
                                        <option value="sent" <?php echo $inv['status'] === 'sent' ? 'selected' : ''; ?>>Sent</option>
                                        <option value="paid" <?php echo $inv['status'] === 'paid' ? 'selected' : ''; ?>>Paid</option>
                                        <option value="cancelled" <?php echo $inv['status'] === 'cancelled' ? 'selected' : ''; ?>>Cancelled</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                <div class="actions-group" style="justify-content: flex-end;">
                                    <?php 
                                    $phone_to_send = !empty($inv['client_phone']) ? $inv['client_phone'] : ($inv['client_saved_phone'] ?? '');
                                    ?>
                                    <button onclick="sendWhatsApp('<?php echo htmlspecialchars($phone_to_send); ?>', '<?php echo htmlspecialchars($inv['client_name']); ?>', '<?php echo htmlspecialchars($inv['invoice_no']); ?>', '<?php echo number_format($inv['total_amount'], 2); ?>', '<?php echo formatDate($inv['invoice_date']); ?>', <?php echo $inv['id']; ?>)" class="btn btn-sm btn-icon" style="background: #25D366; color: white;" title="Send WhatsApp">
                                        <i class="fa-brands fa-whatsapp"></i>
                                    </button>
                                    <a href="print.php?id=<?php echo $inv['id']; ?>" class="btn btn-outline btn-sm" title="Preview/Print Invoice">
                                        <i class="fa-solid fa-print"></i> View
                                    </a>
                                    <a href="invoice-edit.php?id=<?php echo $inv['id']; ?>" class="btn btn-primary btn-sm" title="Edit Invoice">
                                        <i class="fa-solid fa-pen-to-square"></i> Edit
                                    </a>
                                    <a href="invoice-delete.php?id=<?php echo $inv['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete Invoice #<?php echo htmlspecialchars($inv['invoice_no']); ?>?');" title="Delete Invoice">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    <?php endif; ?>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('invoice-search');
    const statusFilter = document.getElementById('status-filter');
    
    function filterInvoices() {
        const searchQuery = searchInput.value.toLowerCase();
        const statusQuery = statusFilter.value.toLowerCase();
        const rows = document.querySelectorAll('#invoices-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const status = row.getAttribute('data-status').toLowerCase();
            
            const matchesSearch = text.includes(searchQuery);
            const matchesStatus = statusQuery === "" || status === statusQuery;
            
            if (matchesSearch && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    if (searchInput) searchInput.addEventListener('keyup', filterInvoices);
    if (statusFilter) statusFilter.addEventListener('change', filterInvoices);
});

function changeStatus(invoiceId, newStatus) {
    if (confirm('Update status of this invoice to ' + newStatus.toUpperCase() + '?')) {
        window.location.href = 'invoices.php?update_status=' + invoiceId + '&status=' + newStatus;
    } else {
        // reload to reset dropdown
        window.location.reload();
    }
}

function sendWhatsApp(phone, clientName, invoiceNo, totalAmount, dateStr, invoiceId) {
    if (!phone || phone.trim() === '') {
        alert('Buyer mobile number is not registered for this invoice! Please update the invoice or client settings.');
        return;
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }
    
    const currentUrl = window.location.origin + '/print.php?id=' + invoiceId;
    const message = `Dear *${clientName}*,\n\nPlease find your Invoice *#${invoiceNo}* dated *${dateStr}* for the amount of *₹${totalAmount}* from *NA NATURAL AIR CONDITION®*.\n\nYou can view and download your tax invoice PDF here: ${currentUrl}\n\nThank you!`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    if (confirm(`We are opening WhatsApp to send the invoice link to ${clientName}.\n\n💡 Tip: To share the actual PDF file, first click 'View' to open the invoice, then select 'Print / Save PDF' to download it, and attach it manually in the WhatsApp chat.`)) {
        window.open(whatsappUrl, '_blank');
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
