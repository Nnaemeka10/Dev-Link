export const getVerificationEmailTemplate = (code: string, userEmail: string) => {
    const escapeHtml = (s: string = "") => {
        return String(s).replace(/[&<>"'\/]/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
        }[c] || c));
    };
    
    const safeCode = escapeHtml(code);
    const safeEmail = escapeHtml(userEmail);
    
    return {
        subject: 'Verify Your Email - Dev-Link',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #0066cc;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #0066cc;
                    }
                    .content {
                        padding: 30px 0;
                    }
                    .code-box {
                        background-color: #f5f5f5;
                        border: 2px dashed #0066cc;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .code {
                        font-size: 32px;
                        font-weight: bold;
                        color: #0066cc;
                        letter-spacing: 5px;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🧳 Dev-Link</div>
                    </div>
                    <div class="content">
                        <h2>Email Verification</h2>
                        <p>Hello,</p>
                        <p>Thank you for signing up with Dev-link! To complete your registration and activate your account, please use the verification code below:</p>
                        <div class="code-box">
                            <div class="code">${safeCode}</div>
                        </div>
                        <p>This code will expire in <strong>15 minutes</strong>.</p>
                        <p>If you didn't create an account with us, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
                        <p>This email was sent to ${safeEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export const getPasswordResetEmailTemplate = (resetUrl: string, userEmail: string) => {
    const escapeHtml = (s: string = "") => {
        return String(s).replace(/[&<>"'\/]/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
        }[c] || c));
    };
    
    const safeResetUrl = escapeHtml(resetUrl);
    const safeEmail = escapeHtml(userEmail);
    
    return {
        subject: 'Reset Your Password - Dev-Link',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #0066cc;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #0066cc;
                    }
                    .content {
                        padding: 30px 0;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #0066cc;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 14px;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border: 1px solid #ffc107;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🧳 Dev-Link</div>
                    </div>
                    <div class="content">
                        <h2>Reset Your Password</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <div style="text-align: center;">
                            <a href="${safeResetUrl}" class="button">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #0066cc;">${safeResetUrl}</p>
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul style="margin: 10px 0;">
                                <li>This link will expire in <strong>1 hour</strong></li>
                                <li>If you didn't request a password reset, please ignore this email</li>
                                <li>Never share this link with anyone</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
                        <p>This email was sent to ${safeEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export const getPasswordResetSuccessTemplate = (userEmail: string) => {
    const escapeHtml = (s: string = "") => {
        return String(s).replace(/[&<>"'\/]/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
        }[c] || c));
    };
    
    const safeEmail = escapeHtml(userEmail);
    
    return {
        subject: 'Password Successfully Reset - Dev-Link',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #0066cc;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #0066cc;
                    }
                    .content {
                        padding: 30px 0;
                    }
                    .success {
                        background-color: #d4edda;
                        border: 1px solid #28a745;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🧳 Dev-Link</div>
                    </div>
                    <div class="content">
                        <h2>Password Reset Successful</h2>
                        <div class="success">
                            <h3>✅ Your password has been successfully reset!</h3>
                        </div>
                        <p>Hello,</p>
                        <p>This is a confirmation that your password for your Dev-Link account has been changed.</p>
                        <p>If you did not make this change, please contact our support team immediately.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
                        <p>This email was sent to ${safeEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export const getWelcomeEmailTemplate = (userName: string, userEmail: string) => {
    const escapeHtml = (s: string = "") => {
        return String(s).replace(/[&<>"'\/]/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
        }[c] || c));
    };
    
    const safeName = escapeHtml(userName);
    const safeEmail = escapeHtml(userEmail);
    
    return {
        subject: 'Welcome to Dev-Link! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #0066cc;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #0066cc;
                    }
                    .content {
                        padding: 30px 0;
                    }
                    .welcome-box {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 12px;
                        padding: 30px;
                        text-align: center;
                        color: white;
                        margin: 20px 0;
                    }
                    .welcome-box h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .feature-box {
                        background-color: #f8f9fa;
                        border-left: 4px solid #0066cc;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 15px 0;
                    }
                    .feature-box h3 {
                        margin-top: 0;
                        color: #0066cc;
                    }
                    .cta-button {
                        display: inline-block;
                        padding: 15px 40px;
                        background-color: #0066cc;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🧳 Dev-Link</div>
                    </div>
                    <div class="content">
                        <div class="welcome-box">
                            <h1>Welcome to Dev-Link! 🎉</h1>
                            <p style="font-size: 18px; margin: 10px 0 0 0;">We're excited to have you on board, ${safeName}!</p>
                        </div>
                        
                        <p>Hello ${safeName},</p>
                        <p>Thank you for joining Dev-Link - your gateway to connecting talented developers with amazing opportunities!</p>
                        
                        <h2 style="color: #0066cc;">Getting Started</h2>
                        
                        <div class="feature-box">
                            <h3>📝 Complete Your Profile</h3>
                            <p>Add your skills, experience, and what you're looking for to stand out to potential employers.</p>
                        </div>
                        
                        <div class="feature-box">
                            <h3>🔍 Browse Opportunities</h3>
                            <p>Explore thousands of job listings from companies looking for talent like you.</p>
                        </div>
                        
                        <div class="feature-box">
                            <h3>🤝 Connect & Network</h3>
                            <p>Build meaningful connections with employers and fellow developers in the community.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="#" class="cta-button">Complete Your Profile</a>
                        </div>
                        
                        <h3>Need Help?</h3>
                        <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out anytime!</p>
                        
                        <p style="margin-top: 30px;">Best regards,<br><strong>The Dev-Link Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
                        <p>This email was sent to ${safeEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

