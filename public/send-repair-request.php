<?php
// Repair-request form handler.
//
// The site is a static export, so this small PHP endpoint is the only server
// side piece. It validates the submission and emails it to the shop. Deployed
// as /send-repair-request.php next to the exported HTML.
//
// Responses are JSON so the form can stay on the page.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const RECIPIENT = 'info@bartar-repairer.com';
const SITE_NAME = 'مرکز تخصصی تعمیرات برتر';

function fail(string $message, int $status = 400): never {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('روش درخواست نامعتبر است.', 405);
}

// Honeypot: real users never fill a hidden field. Bots do. Answer 200 so the
// bot believes it succeeded and does not retry.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$clean = static function (string $key, int $max = 300): string {
    $value = trim((string)($_POST[$key] ?? ''));
    // Strip CR/LF so no one can inject extra mail headers.
    $value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
    return mb_substr($value, 0, $max);
};

$name    = $clean('name', 120);
$phone   = $clean('phone', 40);
$device  = $clean('device', 60);
$brand   = $clean('brand', 60);
$model   = $clean('model', 120);
$branch  = $clean('branch', 60);
$problem = trim((string)($_POST['problem'] ?? ''));
$problem = mb_substr(strip_tags($problem), 0, 2000);

if ($name === '' || $phone === '' || $problem === '') {
    fail('نام، شماره تماس و شرح ایراد الزامی است.');
}

// Iranian mobile or landline, with or without country code.
$digits = preg_replace('/\D+/', '', $phone) ?? '';
if (strlen($digits) < 8 || strlen($digits) > 15) {
    fail('شماره تماس معتبر نیست.');
}

$lines = [
    'درخواست تعمیر جدید از سایت',
    '',
    'نام: ' . $name,
    'شماره تماس: ' . $phone,
    'نوع دستگاه: ' . ($device !== '' ? $device : '—'),
    'برند: ' . ($brand !== '' ? $brand : '—'),
    'مدل: ' . ($model !== '' ? $model : '—'),
    'شعبه مورد نظر: ' . ($branch !== '' ? $branch : '—'),
    '',
    'شرح ایراد:',
    $problem,
    '',
    '---',
    'زمان ثبت: ' . date('Y-m-d H:i:s'),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '—'),
];
$body = implode("\n", $lines);

$subject = 'درخواست تعمیر: ' . ($brand !== '' ? $brand . ' ' : '') . ($model !== '' ? $model : $name);

// From must be a mailbox on this domain or most hosts reject the message;
// the customer's number goes in the body and Reply-To is left off because a
// phone number is not a valid reply address.
$headers = implode("\r\n", [
    'From: ' . SITE_NAME . ' <no-reply@bartar-repairer.com>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

if (!@mail(RECIPIENT, $encodedSubject, $body, $headers)) {
    fail('ارسال درخواست ناموفق بود. لطفا تماس بگیرید.', 500);
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
