<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config/database.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id > 0) {
    try {
        $db = getDB();
        $db->beginTransaction();
        
        // Fetch invoice number for the notification alert
        $stmtNo = $db->prepare("SELECT invoice_no FROM invoices WHERE id = ?");
        $stmtNo->execute([$id]);
        $invoice_no = $stmtNo->fetchColumn();
        
        if ($invoice_no) {
            // Delete invoice line items first
            $delItems = $db->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
            $delItems->execute([$id]);
            
            // Delete invoice record
            $delInvoice = $db->prepare("DELETE FROM invoices WHERE id = ?");
            $delInvoice->execute([$id]);
            
            $db->commit();
            $_SESSION['flash_success'] = "Invoice #{$invoice_no} deleted successfully!";
        } else {
            $db->rollBack();
            $_SESSION['flash_danger'] = "Invoice not found!";
        }
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        $_SESSION['flash_danger'] = "Failed to delete invoice: " . $e->getMessage();
    }
} else {
    $_SESSION['flash_danger'] = "Invalid invoice ID specified.";
}

header("Location: invoices.php");
exit;
?>
