<?php
$page_title = "Clients";
$active_page = "clients";
require_once __DIR__ . '/includes/header.php';

$db = getDB();

// Handle CRUD operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    if ($action === 'create') {
        $name = trim($_POST['name']);
        $address = trim($_POST['address']);
        $gstin = trim($_POST['gstin']);
        $phone = trim($_POST['phone']);
        $email = trim($_POST['email']);
        
        if (empty($name)) {
            $_SESSION['flash_danger'] = "Client name is required!";
        } else {
            try {
                $stmt = $db->prepare("INSERT INTO clients (name, address, gstin, phone, email) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$name, $address, $gstin, $phone, $email]);
                $_SESSION['flash_success'] = "Client '$name' added successfully!";
                header("Location: clients.php");
                exit;
            } catch (Exception $e) {
                $_SESSION['flash_danger'] = "Error adding client: " . $e->getMessage();
            }
        }
    }
    
    if ($action === 'update') {
        $id = (int)$_POST['id'];
        $name = trim($_POST['name']);
        $address = trim($_POST['address']);
        $gstin = trim($_POST['gstin']);
        $phone = trim($_POST['phone']);
        $email = trim($_POST['email']);
        
        if (empty($name)) {
            $_SESSION['flash_danger'] = "Client name is required!";
        } else {
            try {
                $stmt = $db->prepare("UPDATE clients SET name = ?, address = ?, gstin = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute([$name, $address, $gstin, $phone, $email, $id]);
                
                // Also update client details in all invoices associated with this client
                // which aren't locked or can be updated
                $stmtInv = $db->prepare("UPDATE invoices SET client_name = ?, client_address = ?, client_gstin = ? WHERE client_id = ?");
                $stmtInv->execute([$name, $address, $gstin, $id]);
                
                $_SESSION['flash_success'] = "Client '$name' updated successfully!";
                header("Location: clients.php");
                exit;
            } catch (Exception $e) {
                $_SESSION['flash_danger'] = "Error updating client: " . $e->getMessage();
            }
        }
    }
}

if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    
    // Check if client has associated invoices
    $invCount = $db->prepare("SELECT COUNT(*) FROM invoices WHERE client_id = ?");
    $invCount->execute([$id]);
    $hasInvoices = $invCount->fetchColumn() > 0;
    
    if ($hasInvoices) {
        $_SESSION['flash_danger'] = "Cannot delete client. This client is associated with existing invoices!";
    } else {
        try {
            // Fetch name for confirmation message
            $stmtName = $db->prepare("SELECT name FROM clients WHERE id = ?");
            $stmtName->execute([$id]);
            $clientName = $stmtName->fetchColumn();
            
            $stmt = $db->prepare("DELETE FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            $_SESSION['flash_success'] = "Client '$clientName' deleted successfully!";
        } catch (Exception $e) {
            $_SESSION['flash_danger'] = "Error deleting client: " . $e->getMessage();
        }
    }
    header("Location: clients.php");
    exit;
}

// Fetch all clients
$clients = $db->query("SELECT * FROM clients ORDER BY name ASC")->fetchAll();
?>

<div class="page-header">
    <h1 class="page-title">Client Management</h1>
    <button class="btn btn-primary" onclick="openAddModal()">
        <i class="fa-solid fa-user-plus"></i> Add New Client
    </button>
</div>

<!-- Search & Filtering -->
<div class="filter-bar card" style="margin-bottom: 1.5rem;">
    <div class="search-input">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="client-search" placeholder="Search clients by name, GSTIN, phone...">
    </div>
</div>

<!-- Clients Table -->
<div class="card">
    <?php if (empty($clients)): ?>
        <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-users-slash"></i></div>
            <p>No clients found. Click the button above to add a client.</p>
        </div>
    <?php else: ?>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">ID</th>
                        <th style="width: 25%">Client Name</th>
                        <th style="width: 15%">GSTIN</th>
                        <th style="width: 15%">Phone</th>
                        <th style="width: 20%">Email</th>
                        <th style="width: 20%; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="clients-table-body">
                    <?php foreach ($clients as $client): ?>
                        <tr data-client-json='<?php echo json_encode($client, JSON_HEX_APOS | JSON_HEX_QUOT); ?>'>
                            <td>#<?php echo $client['id']; ?></td>
                            <td>
                                <div style="font-weight: 600;"><?php echo htmlspecialchars($client['name']); ?></div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    <?php echo htmlspecialchars($client['address']); ?>
                                </div>
                            </td>
                            <td>
                                <?php if (!empty($client['gstin'])): ?>
                                    <span class="badge badge-sent" style="font-family: monospace;"><?php echo htmlspecialchars($client['gstin']); ?></span>
                                <?php else: ?>
                                    <span class="badge badge-draft">N/A</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo htmlspecialchars($client['phone'] ?: '-'); ?></td>
                            <td><?php echo htmlspecialchars($client['email'] ?: '-'); ?></td>
                            <td>
                                <div class="actions-group" style="justify-content: flex-end;">
                                    <button class="btn btn-outline btn-sm" onclick='openEditModal(this.closest("tr").getAttribute("data-client-json"))' title="Edit Client">
                                        <i class="fa-solid fa-pen-to-square"></i> Edit
                                    </button>
                                    <a href="clients.php?delete=<?php echo $client['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this client?');" title="Delete Client">
                                        <i class="fa-solid fa-trash-can"></i> Delete
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

<!-- Add/Edit Client Modal -->
<div class="modal-overlay" id="client-modal">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Add New Client</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <form method="POST" action="clients.php">
            <input type="hidden" name="action" id="modal-action" value="create">
            <input type="hidden" name="id" id="client-id" value="">
            
            <div class="form-group">
                <label for="client-name">Client/Company Name</label>
                <input type="text" name="name" id="client-name" required placeholder="e.g. Acme Corporation">
            </div>
            
            <div class="form-group">
                <label for="client-gstin">GSTIN (Optional)</label>
                <input type="text" name="gstin" id="client-gstin" placeholder="e.g. 23AORPA7441L1ZR">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="client-phone">Phone Number</label>
                    <input type="text" name="phone" id="client-phone" placeholder="e.g. 9876543210">
                </div>
                <div class="form-group">
                    <label for="client-email">Email Address</label>
                    <input type="email" name="email" id="client-email" placeholder="e.g. client@example.com">
                </div>
            </div>
            
            <div class="form-group">
                <label for="client-address">Billing Address</label>
                <textarea name="address" id="client-address" rows="3" placeholder="Street name, City, State, ZIP..."></textarea>
            </div>
            
            <div class="divider"></div>
            
            <div class="actions-group" style="justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modal-submit-btn">Save Client</button>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Interactive search
    const searchInput = document.getElementById('client-search');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#clients-table-body tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});

const modalOverlay = document.getElementById('client-modal');
const modalTitle = document.getElementById('modal-title');
const actionInput = document.getElementById('modal-action');
const clientIdInput = document.getElementById('client-id');
const clientNameInput = document.getElementById('client-name');
const clientGstinInput = document.getElementById('client-gstin');
const clientPhoneInput = document.getElementById('client-phone');
const clientEmailInput = document.getElementById('client-email');
const clientAddressInput = document.getElementById('client-address');

function openAddModal() {
    modalTitle.textContent = 'Add New Client';
    actionInput.value = 'create';
    clientIdInput.value = '';
    clientNameInput.value = '';
    clientGstinInput.value = '';
    clientPhoneInput.value = '';
    clientEmailInput.value = '';
    clientAddressInput.value = '';
    modalOverlay.classList.add('active');
}

function openEditModal(clientJsonString) {
    try {
        const client = JSON.parse(clientJsonString);
        modalTitle.textContent = 'Edit Client Details';
        actionInput.value = 'update';
        clientIdInput.value = client.id;
        clientNameInput.value = client.name || '';
        clientGstinInput.value = client.gstin || '';
        clientPhoneInput.value = client.phone || '';
        clientEmailInput.value = client.email || '';
        clientAddressInput.value = client.address || '';
        modalOverlay.classList.add('active');
    } catch (e) {
        console.error("Failed to parse client data:", e);
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// Close modal when clicking outside the container
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
