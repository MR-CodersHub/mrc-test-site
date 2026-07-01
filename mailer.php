<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/includes/TemplateRenderer.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

$recaptchaSecret = '6LddGS8tAAAAAHD2LAHuk6POlbUvd_ByUPx6mQT4';

$smtpHost = 'mail.mrcodershub.com';
$smtpPort = 465;
$smtpUsername = 'no_reply@mrcodershub.com';
$smtpPassword = '&nrGuZAU)uUp';

$toEmail = 'info@mrcodershub.com';
$toName  = 'MR CODERS HUB';

// Used inside the email templates (templates/notification.html & templates/thank-you.html)
$companyName    = 'MR CODERS HUB';
$companyWebsite = 'https://www.mrcodershub.com';
$companyEmail   = 'info@mrcodershub.com';
$responseTime   = '24-48 hours';

/*
|--------------------------------------------------------------------------
| INPUT PARSING & SANITIZATION
|--------------------------------------------------------------------------
*/

// Detect content type and parse input
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
if (strpos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
} else {
    $input = $_POST;
}

// Extract base fields
$name  = trim($input['fullName'] ?? $input['name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$type  = trim($input['type'] ?? 'general'); // 'student' or 'business'
$category = trim($input['category'] ?? $input['serviceType'] ?? '');

if (empty($name) || empty($email)) {
    echo json_encode([
        'status' => false,
        'message' => 'Please fill all required fields (Name and Email).'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'status' => false,
        'message' => 'Invalid email address.'
    ]);
    exit;
}

// Format the dynamic fields into a clean HTML table
$detailsHtml = '<table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif;">';
$detailsHtml .= '<thead><tr style="background-color: #4F46E5; color: #ffffff;"><th colspan="2" style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; border-radius: 6px 6px 0 0;">Submission Details</th></tr></thead>';
$detailsHtml .= '<tbody>';

// Add Form Type
$detailsHtml .= '<tr><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; width: 180px; background-color: #f9fafb;">Form Type</td><td style="padding: 10px; border: 1px solid #e5e7eb;">' . htmlspecialchars(ucfirst($type), ENT_QUOTES, 'UTF-8') . '</td></tr>';

// Add Category / Service Type
if (!empty($category)) {
    $label = ($type === 'student') ? 'Category' : 'Service Type';
    $detailsHtml .= '<tr><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">' . $label . '</td><td style="padding: 10px; border: 1px solid #e5e7eb;">' . htmlspecialchars(ucfirst($category), ENT_QUOTES, 'UTF-8') . '</td></tr>';
}

// Add other dynamic fields
$excludeFields = ['fullName', 'name', 'email', 'phone', 'type', 'category', 'serviceType', 'resumeBase64', 'resumeName', 'token'];
foreach ($input as $key => $value) {
    if (in_array($key, $excludeFields)) {
        continue;
    }
    
    // Convert camelCase key to Human Readable (e.g. courseName -> Course Name)
    $formattedKey = preg_replace('/(?<!^)[A-Z]/', ' $0', $key);
    $formattedKey = ucwords(strtolower($formattedKey));
    
    $safeVal = nl2br(htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'));
    
    $detailsHtml .= "<tr><td style='padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;'>{$formattedKey}</td><td style='padding: 10px; border: 1px solid #e5e7eb;'>{$safeVal}</td></tr>";
}

$hasAttachment = false;
$resumeBase64 = $input['resumeBase64'] ?? '';
$resumeName = $input['resumeName'] ?? '';

if (!empty($resumeBase64) && !empty($resumeName)) {
    $hasAttachment = true;
    $detailsHtml .= '<tr><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Resume File</td><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #10b981;">&check; Attached: ' . htmlspecialchars($resumeName, ENT_QUOTES, 'UTF-8') . '</td></tr>';
}

$detailsHtml .= '</tbody></table>';

// Build the email subject line
$subject = "New " . ucfirst($type) . " Enquiry from " . $name;
if (!empty($category)) {
    $subject .= " (" . ucfirst($category) . ")";
}

/*
|--------------------------------------------------------------------------
| BUILD TEMPLATE DATA
|--------------------------------------------------------------------------
*/

$safeName    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$safeEmail   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$safePhone   = htmlspecialchars($phone !== '' ? $phone : 'N/A', ENT_QUOTES, 'UTF-8');
$safeSubject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');

$submissionDate = date('F j, Y \a\t g:i A');
$customerIp     = htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'Unknown', ENT_QUOTES, 'UTF-8');
$currentYear    = date('Y');

/*
|--------------------------------------------------------------------------
| SMTP MAILER FACTORY
|--------------------------------------------------------------------------
*/

function createSmtpMailer(string $host, int $port, string $username, string $password): PHPMailer
{
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = $host;
    $mail->SMTPAuth   = true;
    $mail->Username   = $username;
    $mail->Password   = $password;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $port;
    $mail->isHTML(true);

    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    return $mail;
}

/*
|--------------------------------------------------------------------------
| SEND ADMIN NOTIFICATION EMAIL
|--------------------------------------------------------------------------
*/

try {

    $mail = createSmtpMailer($smtpHost, $smtpPort, $smtpUsername, $smtpPassword);

    $mail->setFrom($smtpUsername, 'Website Contact Form');
    $mail->addAddress($toEmail, $toName);
    $mail->addReplyTo($email, $name);

    $mail->Subject = $subject;

    $mail->Body = TemplateRenderer::render(__DIR__ . '/templates/notification.html', [
        'company_name'     => $companyName,
        'company_website'  => $companyWebsite,
        'customer_name'    => $safeName,
        'customer_email'   => $safeEmail,
        'customer_phone'   => $safePhone,
        'subject'          => $safeSubject,
        'message_html'     => $detailsHtml,
        'submission_date'  => $submissionDate,
        'customer_ip'      => $customerIp,
        'current_year'     => $currentYear,
    ]);

    // Format plain text AltBody
    $altBody = "New " . ucfirst($type) . " enquiry from {$name}\n\n"
        . "Name: {$name}\n"
        . "Email: {$email}\n"
        . "Phone: {$safePhone}\n"
        . "Subject: {$subject}\n\n"
        . "Submission Details:\n";
        
    foreach ($input as $key => $value) {
        if (in_array($key, ['resumeBase64', 'token'])) continue;
        $formattedKey = preg_replace('/(?<!^)[A-Z]/', ' $0', $key);
        $formattedKey = ucwords(strtolower($formattedKey));
        $altBody .= "{$formattedKey}: {$value}\n";
    }

    $mail->AltBody = $altBody;

    // Handle resume attachment if present
    if ($hasAttachment) {
        $base64Data = $resumeBase64;
        if (strpos($base64Data, ',') !== false) {
            $base64Data = explode(',', $base64Data)[1];
        }
        $decodedResume = base64_decode($base64Data);
        if ($decodedResume !== false) {
            $mail->addStringAttachment($decodedResume, $resumeName);
        }
    }

    $mail->send();

    /*
    |----------------------------------------------------------------------
    | SEND THANK-YOU EMAIL TO THE CUSTOMER
    |----------------------------------------------------------------------
    */

    try {

        $thankYouMail = createSmtpMailer($smtpHost, $smtpPort, $smtpUsername, $smtpPassword);

        $thankYouMail->setFrom($smtpUsername, $companyName);
        $thankYouMail->addAddress($email, $name);
        $thankYouMail->addReplyTo($companyEmail, $companyName);

        $thankYouMail->Subject = "We've received your enquiry - {$companyName}";

        $thankYouMail->Body = TemplateRenderer::render(__DIR__ . '/templates/thank-you.html', [
            'company_name'    => $companyName,
            'company_website' => $companyWebsite,
            'company_email'   => $companyEmail,
            'customer_name'   => $safeName,
            'customer_email'  => $safeEmail,
            'subject'         => $safeSubject,
            'message_html'    => "We have received your " . ($type === 'student' ? 'application' : 'business request') . " and our team is reviewing it. We will be in touch shortly.",
            'response_time'   => $responseTime,
            'current_year'    => $currentYear,
        ]);

        $thankYouMail->AltBody = "Hi {$name},\n\n"
            . "Thank you for contacting {$companyName}. We've received your enquiry and our team will get back to you within {$responseTime}.\n\n"
            . "Warm regards,\n{$companyName} Team";

        $thankYouMail->send();

    } catch (Exception $e) {
        error_log('Thank-you email failed: ' . $thankYouMail->ErrorInfo);
    }

    echo json_encode([
        'status' => true,
        'message' => 'Message sent successfully.'
    ]);

} catch (Exception $e) {

    echo json_encode([
        'status' => false,
        'message' => 'Mail sending failed.',
        'error' => $mail->ErrorInfo
    ]);
}
    