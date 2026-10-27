<?php
/**
 * Helper functions for Bill Generator
 */

/**
 * Format helper for dates
 */
function formatDate($dateStr) {
    if (empty($dateStr)) return '';
    return date('d-M-Y', strtotime($dateStr));
}

/**
 * Format currency to Indian Rupees (INR) format (e.g. ₹ 1,50,000.00)
 */
function formatCurrency($number) {
    if ($number === null || $number === '') {
        $number = 0;
    }
    
    // Split into integer and decimal parts
    $number = sprintf("%.2f", $number);
    list($integer, $decimal) = explode('.', $number);
    
    $negative = '';
    if (substr($integer, 0, 1) === '-') {
        $negative = '-';
        $integer = substr($integer, 1);
    }
    
    $len = strlen($integer);
    if ($len <= 3) {
        return '₹' . $negative . $integer . '.' . $decimal;
    }
    
    // Grouping for Indian numbering system: lakhs, crores
    $last_three = substr($integer, -3);
    $rest = substr($integer, 0, -3);
    if (strlen($rest) % 2 != 0) {
        $rest = "0" . $rest;
    }
    
    $chunks = str_split($rest, 2);
    $formatted = implode(',', $chunks);
    $formatted = ltrim($formatted, '0,');
    
    return '₹' . $negative . ($formatted ? $formatted . ',' : '') . $last_three . '.' . $decimal;
}

/**
 * Convert number to words in Indian numbering system
 */
function getAmountInWords($number) {
    if ($number === null || $number === '') {
        return 'Zero Rupees Only';
    }
    
    $number = round($number, 2);
    $decimal = round($number - ($no = floor($number)), 2) * 100;
    $hundred = null;
    $digits_length = strlen($no);
    $i = 0;
    $str = array();
    $words = array(
        0 => '', 1 => 'One', 2 => 'Two',
        3 => 'Three', 4 => 'Four', 5 => 'Five', 6 => 'Six',
        7 => 'Seven', 8 => 'Eight', 9 => 'Nine',
        10 => 'Ten', 11 => 'Eleven', 12 => 'Twelve',
        13 => 'Thirteen', 14 => 'Fourteen', 15 => 'Fifteen',
        16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen',
        19 => 'Nineteen', 20 => 'Twenty', 30 => 'Thirty',
        40 => 'Forty', 50 => 'Fifty', 60 => 'Sixty',
        70 => 'Seventy', 80 => 'Eighty', 90 => 'Ninety'
    );
    
    $digits = array('', 'Hundred', 'Thousand', 'Lakh', 'Crore');
    
    while ($i < $digits_length) {
        $divider = ($i == 2) ? 10 : 100;
        $num = floor($no % $divider);
        $no = floor($no / $divider);
        $i += ($divider == 10) ? 1 : 2;
        
        if ($num) {
            $counter = count($str);
            $hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
            
            if ($num < 21) {
                $str[] = $words[$num] . ' ' . $digits[$counter] . ' ' . $hundred;
            } else {
                $str[] = $words[floor($num / 10) * 10] . ' ' . $words[$num % 10] . ' ' . $digits[$counter] . ' ' . $hundred;
            }
        } else {
            $str[] = null;
        }
    }
    
    $Rupees = implode('', array_reverse($str));
    $paise_words = '';
    
    if ($decimal > 0) {
        $decimal = (int)$decimal;
        if ($decimal < 21) {
            $paise_words = $words[$decimal];
        } else {
            $paise_words = $words[floor($decimal / 10) * 10] . ' ' . $words[$decimal % 10];
        }
        $paise_words = ' and ' . $paise_words . ' Paise';
    }
    
    $Rupees = trim($Rupees);
    return ($Rupees ? $Rupees . ' Rupees' : '') . $paise_words . ' Only';
}
?>
