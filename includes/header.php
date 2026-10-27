<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $db = getDB();
    $company = $db->query("SELECT name FROM company_settings LIMIT 1")->fetch();
    $company_name = $company ? htmlspecialchars($company['name']) : 'NA NATURAL AIR CONDITION';
} catch (Exception $e) {
    $company_name = 'Bill Generator';
}

$current_page = isset($active_page) ? $active_page : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' . $company_name : $company_name; ?></title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Stylesheet -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<nav class="navbar no-print">
    <a href="dashboard.php" class="navbar-brand">
        <div class="logo-icon">
            <i class="fa-solid fa-file-invoice-dollar" style="color: white;"></i>
        </div>
        <span><?php echo (strlen($company_name) > 25 ? substr($company_name, 0, 22) . '...' : $company_name) . '®'; ?></span>
    </a>
    
    <button class="hamburger" id="hamburger-btn" aria-label="Toggle navigation">
        <span></span>
        <span></span>
        <span></span>
    </button>
    
    <ul class="navbar-nav" id="navbar-menu">
        <li>
            <a href="dashboard.php" class="<?php echo $current_page === 'dashboard' ? 'active' : ''; ?>">
                <i class="fa-solid fa-chart-pie"></i> Dashboard
            </a>
        </li>
        <li>
            <a href="invoices.php" class="<?php echo $current_page === 'invoices' ? 'active' : ''; ?>">
                <i class="fa-solid fa-file-invoice"></i> Invoices
            </a>
        </li>
        <li>
            <a href="clients.php" class="<?php echo $current_page === 'clients' ? 'active' : ''; ?>">
                <i class="fa-solid fa-users"></i> Clients
            </a>
        </li>
        <li>
            <a href="settings.php" class="<?php echo $current_page === 'settings' ? 'active' : ''; ?>">
                <i class="fa-solid fa-gears"></i> Settings
            </a>
        </li>
    </ul>
</nav>

<main class="main-container">
    <?php if (isset($_SESSION['flash_success'])): ?>
        <div class="alert alert-success" id="flash-success">
            <i class="fa-solid fa-circle-check"></i>
            <span><?php echo $_SESSION['flash_success']; unset($_SESSION['flash_success']); ?></span>
            <button onclick="document.getElementById('flash-success').style.display='none'" class="modal-close" style="margin-left: auto;">&times;</button>
        </div>
    <?php endif; ?>

    <?php if (isset($_SESSION['flash_danger'])): ?>
        <div class="alert alert-danger" id="flash-danger">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span><?php echo $_SESSION['flash_danger']; unset($_SESSION['flash_danger']); ?></span>
            <button onclick="document.getElementById('flash-danger').style.display='none'" class="modal-close" style="margin-left: auto;">&times;</button>
        </div>
    <?php endif; ?>

    <?php if (isset($_SESSION['flash_warning'])): ?>
        <div class="alert alert-warning" id="flash-warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span><?php echo $_SESSION['flash_warning']; unset($_SESSION['flash_warning']); ?></span>
            <button onclick="document.getElementById('flash-warning').style.display='none'" class="modal-close" style="margin-left: auto;">&times;</button>
        </div>
    <?php endif; ?>
