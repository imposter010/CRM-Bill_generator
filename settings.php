<?php
$page_title = "Settings";
$active_page = "settings";
require_once __DIR__ . '/includes/header.php';

$db = getDB();

// Fetch settings
$settings = $db->query("SELECT * FROM company_settings LIMIT 1")->fetch();

if (!$settings) {
    // If somehow deleted, insert default row
    $db->exec("INSERT INTO company_settings (name, address, phone, email, gstin, state, bank_name, branch, account_no, ifsc_code, terms)
        VALUES ('NA NATURAL AIR CONDITION', '39/2 Narsingh Bazar Indore', '9111303654', 'arshanahma@gmail.com', '23AORPA7441L1ZR', 'STATE 23 Madhya Parades', 'UCO BANK', 'BALVINAYMANDER INDORE', '19950110059142', 'UCBA0001995', 'Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E.')");
    $settings = $db->query("SELECT * FROM company_settings LIMIT 1")->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name']);
    $address = trim($_POST['address']);
    $phone = trim($_POST['phone']);
    $email = trim($_POST['email']);
    $gstin = trim($_POST['gstin']);
    $state = trim($_POST['state']);
    $bank_name = trim($_POST['bank_name']);
    $branch = trim($_POST['branch']);
    $account_no = trim($_POST['account_no']);
    $ifsc_code = trim($_POST['ifsc_code']);
    $terms = trim($_POST['terms']);
    
    try {
        $stmt = $db->prepare("UPDATE company_settings SET 
            name = ?, address = ?, phone = ?, email = ?, gstin = ?, state = ?, 
            bank_name = ?, branch = ?, account_no = ?, ifsc_code = ?, terms = ?, 
            updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?");
        $stmt->execute([$name, $address, $phone, $email, $gstin, $state, $bank_name, $branch, $account_no, $ifsc_code, $terms, $settings['id']]);
        
        $_SESSION['flash_success'] = "Company settings updated successfully!";
        header("Location: settings.php");
        exit;
    } catch (Exception $e) {
        $_SESSION['flash_danger'] = "Failed to update settings: " . $e->getMessage();
    }
}
?>

<form method="POST" action="settings.php">
    <div class="page-header">
        <h1 class="page-title">Company Settings</h1>
        <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk"></i> Save Settings
        </button>
    </div>

    <div class="invoice-layout">
        <!-- Left Column: Company Info -->
        <div class="card">
            <h2 class="card-title">
                <span class="icon"><i class="fa-solid fa-building"></i></span> Issuer Company Details
            </h2>
            
            <div class="form-group">
                <label for="name">Company Name</label>
                <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($settings['name']); ?>" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="text" id="phone" name="phone" value="<?php echo htmlspecialchars($settings['phone']); ?>">
                </div>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($settings['email']); ?>">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="gstin">GSTIN</label>
                    <input type="text" id="gstin" name="gstin" value="<?php echo htmlspecialchars($settings['gstin']); ?>" required placeholder="e.g. 23AORPA7441L1ZR">
                </div>
                <div class="form-group">
                    <label for="state">State & State Code</label>
                    <input type="text" id="state" name="state" value="<?php echo htmlspecialchars($settings['state']); ?>" required placeholder="e.g. STATE 23 Madhya Parades">
                </div>
            </div>
            
            <div class="form-group">
                <label for="address">Business Address</label>
                <textarea id="address" name="address" rows="4" required><?php echo htmlspecialchars($settings['address']); ?></textarea>
            </div>
        </div>

        <!-- Right Column: Bank & Terms -->
        <div class="card">
            <h2 class="card-title">
                <span class="icon"><i class="fa-solid fa-building-columns"></i></span> Bank Account Details
            </h2>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="bank_name">Bank Name</label>
                    <input type="text" id="bank_name" name="bank_name" value="<?php echo htmlspecialchars($settings['bank_name']); ?>">
                </div>
                <div class="form-group">
                    <label for="branch">Branch Name</label>
                    <input type="text" id="branch" name="branch" value="<?php echo htmlspecialchars($settings['branch']); ?>">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="account_no">Account Number</label>
                    <input type="text" id="account_no" name="account_no" value="<?php echo htmlspecialchars($settings['account_no']); ?>">
                </div>
                <div class="form-group">
                    <label for="ifsc_code">IFSC Code</label>
                    <input type="text" id="ifsc_code" name="ifsc_code" value="<?php echo htmlspecialchars($settings['ifsc_code']); ?>">
                </div>
            </div>
            
            <div class="divider"></div>
            
            <h2 class="card-title" style="margin-top: 1rem;">
                <span class="icon"><i class="fa-solid fa-file-contract"></i></span> Terms & Conditions
            </h2>
            
            <div class="form-group">
                <label for="terms">Invoice Terms (One per line)</label>
                <textarea id="terms" name="terms" rows="6" placeholder="Terms & conditions..."><?php echo htmlspecialchars($settings['terms']); ?></textarea>
            </div>
        </div>
    </div>
</form>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
