<?php
$page_title = "Dashboard";
$active_page = "dashboard";
require_once __DIR__ . '/includes/header.php';

$db = getDB();

// Fetch summary metrics
try {
    $total_invoices = (int)$db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
    $total_billed = (float)$db->query("SELECT SUM(total_amount) FROM invoices WHERE status != 'cancelled'")->fetchColumn();
    $total_paid = (float)$db->query("SELECT SUM(total_amount) FROM invoices WHERE status = 'paid'")->fetchColumn();
    $total_pending = (float)$db->query("SELECT SUM(total_amount) FROM invoices WHERE status IN ('draft', 'sent')")->fetchColumn();
    
    // Fetch count of clients
    $total_clients = (int)$db->query("SELECT COUNT(*) FROM clients")->fetchColumn();
    
    // Fetch latest 5 invoices
    $recent_invoices = $db->query("SELECT * FROM invoices ORDER BY invoice_date DESC, id DESC LIMIT 5")->fetchAll();
} catch (Exception $e) {
    $total_invoices = 0;
    $total_billed = 0;
    $total_paid = 0;
    $total_pending = 0;
    $total_clients = 0;
    $recent_invoices = [];
}
?>

<div class="page-header">
    <h1 class="page-title">Dashboard Overview</h1>
    <div>
        <a href="invoice-create.php" class="btn btn-primary">
            <i class="fa-solid fa-file-signature"></i> Create Invoice
        </a>
    </div>
</div>

<!-- Stats Grid -->
<div class="stats-grid">
    <!-- Stat 1: Total Billed -->
    <div class="stat-card blue">
        <div class="stat-icon blue">
            <i class="fa-solid fa-wallet"></i>
        </div>
        <div class="stat-info">
            <h3><?php echo formatCurrency($total_billed); ?></h3>
            <p>Total Billed (Active)</p>
        </div>
    </div>
    
    <!-- Stat 2: Total Paid -->
    <div class="stat-card green">
        <div class="stat-icon green">
            <i class="fa-solid fa-circle-dollar-to-slot"></i>
        </div>
        <div class="stat-info">
            <h3><?php echo formatCurrency($total_paid); ?></h3>
            <p>Total Paid Collections</p>
        </div>
    </div>
    
    <!-- Stat 3: Total Pending -->
    <div class="stat-card orange">
        <div class="stat-icon orange">
            <i class="fa-solid fa-hourglass-half"></i>
        </div>
        <div class="stat-info">
            <h3><?php echo formatCurrency($total_pending); ?></h3>
            <p>Pending Collections</p>
        </div>
    </div>
    
    <!-- Stat 4: Invoices Issued -->
    <div class="stat-card red">
        <div class="stat-icon red">
            <i class="fa-solid fa-file-invoice"></i>
        </div>
        <div class="stat-info">
            <h3><?php echo $total_invoices; ?></h3>
            <p>Invoices Created</p>
        </div>
    </div>
</div>

<!-- Details & Split Grid -->
<div class="invoice-layout" style="margin-top: 1.5rem;">
    <!-- Recent Invoices -->
    <div class="card" style="grid-column: span 1.3;">
        <h2 class="card-title">
            <span class="icon"><i class="fa-solid fa-clock-rotate-left"></i></span> Recent Invoices
        </h2>
        
        <?php if (empty($recent_invoices)): ?>
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                <p>No invoices created yet. Generate one to view details.</p>
                <a href="invoice-create.php" class="btn btn-outline btn-sm">Create First Invoice</a>
            </div>
        <?php else: ?>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Inv No</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th style="text-align: right;">Amount</th>
                            <th style="text-align: center;">Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_invoices as $inv): ?>
                            <tr>
                                <td style="font-family: monospace; font-weight: 700;">
                                    <?php echo htmlspecialchars($inv['invoice_no']); ?>
                                </td>
                                <td>
                                    <div style="font-weight: 600; font-size: 0.85rem;">
                                        <?php echo htmlspecialchars($inv['client_name']); ?>
                                    </div>
                                </td>
                                <td><?php echo formatDate($inv['invoice_date']); ?></td>
                                <td style="text-align: right; font-weight: 600; color: var(--accent-light);">
                                    <?php echo formatCurrency($inv['total_amount']); ?>
                                </td>
                                <td style="text-align: center;">
                                    <span class="badge badge-<?php echo $inv['status']; ?>">
                                        <?php echo ucfirst($inv['status']); ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="actions-group" style="justify-content: flex-end;">
                                        <a href="print.php?id=<?php echo $inv['id']; ?>" class="btn btn-outline btn-sm btn-icon" title="Print/Preview">
                                            <i class="fa-solid fa-print"></i>
                                        </a>
                                        <a href="invoice-edit.php?id=<?php echo $inv['id']; ?>" class="btn btn-primary btn-sm btn-icon" title="Edit">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1rem; text-align: center;">
                <a href="invoices.php" class="btn btn-outline btn-sm" style="width: 100%; justify-content: center;">
                    <i class="fa-solid fa-list"></i> View All Invoices
                </a>
            </div>
        <?php endif; ?>
    </div>

    <!-- Quick Shortcuts & Quick Stats -->
    <div class="card" style="grid-column: span 0.7;">
        <h2 class="card-title">
            <span class="icon"><i class="fa-solid fa-bolt"></i></span> Quick Shortcuts
        </h2>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <a href="invoice-create.php" class="btn btn-outline" style="text-align: left; width: 100%; padding: 0.85rem 1rem;">
                <i class="fa-solid fa-file-invoice" style="color: var(--primary-light);"></i>
                <div style="text-align: left; margin-left: 0.5rem;">
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">New Tax Invoice</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Create and save a new GST bill</div>
                </div>
            </a>
            
            <a href="clients.php" class="btn btn-outline" style="text-align: left; width: 100%; padding: 0.85rem 1rem;">
                <i class="fa-solid fa-users" style="color: var(--success);"></i>
                <div style="text-align: left; margin-left: 0.5rem;">
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Add New Client</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Register and manage client profiles</div>
                </div>
            </a>
            
            <a href="settings.php" class="btn btn-outline" style="text-align: left; width: 100%; padding: 0.85rem 1rem;">
                <i class="fa-solid fa-gears" style="color: var(--accent);"></i>
                <div style="text-align: left; margin-left: 0.5rem;">
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Company Settings</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Update bank details and business info</div>
                </div>
            </a>
        </div>
        
        <div class="divider"></div>
        
        <h2 class="card-title" style="margin-top: 1rem;">
            <span class="icon"><i class="fa-solid fa-chart-line"></i></span> Client Base
        </h2>
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-glass);">
            <div>
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary);"><?php echo $total_clients; ?></div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">Total Clients Registered</div>
            </div>
            <div style="font-size: 2rem; opacity: 0.15; color: var(--text-primary);">
                <i class="fa-solid fa-users"></i>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
