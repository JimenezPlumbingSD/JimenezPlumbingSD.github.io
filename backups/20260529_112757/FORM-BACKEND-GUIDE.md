# JPS Plumbing Services - Form Backend Implementation Guide

## Form Backend Options

This guide provides implementation options for handling the inquiry form submissions from your website.

## Option 1: PHP Backend (Simple & Hosting-Friendly)

### 1. Create PHP Processing Script

Create `form-process.php` in your project root:

```php
<?php
// form-process.php
header('Content-Type: application/json');

// Configuration
$toEmail = "info@jpsplumbingsd.com"; // Replace with your email
$subject = "New Service Inquiry from JPS Plumbing Website";
$redirectUrl = "/thank-you.html"; // Create this page

// Validate and sanitize input
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

try {
    // Get form data
    $name = sanitizeInput($_POST['name'] ?? '');
    $phone = sanitizeInput($_POST['phone'] ?? '');
    $email = filter_var(sanitizeInput($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    $service = sanitizeInput($_POST['service'] ?? '');
    $message = sanitizeInput($_POST['message'] ?? '');
    
    // Validate required fields
    if (empty($name) || empty($phone) || empty($email) || empty($service)) {
        throw new Exception('Required fields are missing.');
    }
    
    // Create email body
    $emailBody = "New Service Inquiry:\n\n";
    $emailBody .= "Name: $name\n";
    $emailBody .= "Phone: $phone\n";
    $emailBody .= "Email: $email\n";
    $emailBody .= "Service Needed: $service\n";
    $emailBody .= "Message: $message\n";
    
    // Email headers
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email
    $mailSent = mail($toEmail, $subject, $emailBody, $headers);
    
    if (!$mailSent) {
        throw new Exception('Failed to send email.');
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your inquiry! We will contact you shortly.',
        'redirect' => $redirectUrl
    ]);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
```

### 2. Create Thank You Page

Create `thank-you.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You | JPS Plumbing Services</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <div class="header-container">
            <div class="logo">
                <a href="/">
                    <svg viewBox="0 0 200 60" class="logo-svg">
                        <text x="10" y="35" font-family="Montserrat, sans-serif" font-size="24" font-weight="700" fill="#ffffff">JPS</text>
                        <text x="10" y="52" font-family="Open Sans, sans-serif" font-size="14" font-weight="400" fill="#EF3E42">PLUMBING SERVICES</text>
                    </svg>
                </a>
            </div>
        </div>
    </header>
    
    <main class="thank-you-container">
        <div class="thank-you-card">
            <h1>Thank You for Your Inquiry!</h1>
            <p>We've received your request and will contact you shortly to schedule your service.</p>
            <p>For immediate assistance, please call us at <a href="tel:6195551234">(619) 555-1234</a>.</p>
            <a href="/" class="cta-button primary-button">Return to Homepage</a>
        </div>
    </main>
    
    <footer class="footer">
        <div class="footer-bottom">
            <div class="footer-container">
                <p class="copyright">&copy; 2025 JPS Plumbing Services. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>
```

### 3. Update JavaScript Form Handler

Update the form submission handler in `script.js`:

```javascript
// Update the form submission handler
form.addEventListener('submit', function(event) {
    event.preventDefault();
    let isValid = true;
    
    // [Previous validation code remains the same...]
    
    if (isValid) {
        // Show loading state
        const submitButton = form.querySelector('.form-button');
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        // Send form data to PHP backend
        fetch('form-process.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(new FormData(form)).toString()
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect to thank you page
                window.location.href = data.redirect;
            } else {
                throw new Error(data.message || 'Form submission failed');
            }
        })
        .catch(error => {
            alert('There was an error submitting your form: ' + error.message);
            submitButton.textContent = 'Submit Request';
            submitButton.disabled = false;
        });
    }
});
```

### 4. Server Requirements
- PHP 7.4 or higher
- Email sending capability (most hosting providers support this)
- Ability to create new files in the website directory

## Option 2: Node.js Backend (For Advanced Hosting)

### 1. Create Node.js Server

Create `server.js`:

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Form submission endpoint
app.post('/submit-form', async (req, res) => {
    try {
        const { name, phone, email, service, message } = req.body;
        
        // Validate required fields
        if (!name || !phone || !email || !service) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing.'
            });
        }
        
        // Email options
        const mailOptions = {
            from: email,
            to: process.env.TO_EMAIL || 'info@jpsplumbingsd.com',
            subject: 'New Service Inquiry from JPS Plumbing Website',
            text: `New Service Inquiry:

Name: ${name}
Phone: ${phone}
Email: ${email}
Service Needed: ${service}
Message: ${message || 'No message provided'}`
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        // Return success response
        res.json({
            success: true,
            message: 'Thank you for your inquiry! We will contact you shortly.',
            redirect: '/thank-you.html'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email: ' + error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 2. Create `.env` File

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
TO_EMAIL=info@jpsplumbingsd.com
```

### 3. Update JavaScript Form Handler

Update the fetch URL in `script.js`:

```javascript
fetch('/submit-form', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        service: service.value,
        message: message.value.trim()
    })
})
```

### 4. Server Requirements
- Node.js 14+
- npm packages: `express`, `nodemailer`, `dotenv`
- SMTP email service (Gmail, SendGrid, etc.)

## Option 3: Form Service Integration (Easiest)

### 1. Formspree Integration

1. Go to [Formspree](https://formspree.io/) and create an account
2. Create a new form and get your form endpoint
3. Update the form HTML:

```html
<form id="inquiry-form" class="inquiry-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST" novalidate>
    <!-- Existing form fields -->
</form>
```

4. Update JavaScript to handle Formspree response:

```javascript
form.addEventListener('submit', function(event) {
    event.preventDefault();
    let isValid = true;
    
    // [Validation code remains the same...]
    
    if (isValid) {
        // Formspree will handle the submission
        form.submit();
    }
});
```

### 2. Formsubmit.co Integration

1. Use your email in the form action:

```html
<form id="inquiry-form" class="inquiry-form" action="https://formsubmit.co/info@jpsplumbingsd.com" method="POST" novalidate>
    <!-- Existing form fields -->
    <input type="hidden" name="_subject" value="New Service Inquiry from JPS Plumbing">
    <input type="hidden" name="_next" value="https://jimenezplumbingsd.github.io/thank-you.html">
    <input type="hidden" name="_captcha" value="false">
</form>
```

## Security Considerations

1. **Email Injection Protection**: Always sanitize user input
2. **CSRF Protection**: Add CSRF tokens for PHP/Node.js backends
3. **Rate Limiting**: Implement to prevent spam submissions
4. **HTTPS**: Ensure your site uses HTTPS for secure form submissions
5. **Privacy Compliance**: Add privacy policy link and data handling disclosures

## Implementation Checklist

1. [ ] Choose backend option (PHP, Node.js, or Form Service)
2. [ ] Create necessary backend files
3. [ ] Create thank-you.html page
4. [ ] Update form action and JavaScript handler
5. [ ] Test form submission locally
6. [ ] Deploy changes to GitHub
7. [ ] Test live form submission
8. [ ] Set up email notifications
9. [ ] Monitor form submissions
10. [ ] Implement spam protection if needed