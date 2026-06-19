// // export const getVerificationEmailTemplate = (code: string, userEmail: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };
    
// //     const safeCode = escapeHtml(code);
// //     const safeEmail = escapeHtml(userEmail);
    
// //     return {
// //         subject: 'Verify Your Email - Dev-Link',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body {
// //                         font-family: Arial, sans-serif;
// //                         line-height: 1.6;
// //                         color: #333;
// //                     }
// //                     .container {
// //                         max-width: 600px;
// //                         margin: 0 auto;
// //                         padding: 20px;
// //                     }
// //                     .header {
// //                         text-align: center;
// //                         padding: 20px 0;
// //                         border-bottom: 2px solid #0066cc;
// //                     }
// //                     .logo {
// //                         font-size: 24px;
// //                         font-weight: bold;
// //                         color: #0066cc;
// //                     }
// //                     .content {
// //                         padding: 30px 0;
// //                     }
// //                     .code-box {
// //                         background-color: #f5f5f5;
// //                         border: 2px dashed #0066cc;
// //                         border-radius: 8px;
// //                         padding: 20px;
// //                         text-align: center;
// //                         margin: 20px 0;
// //                     }
// //                     .code {
// //                         font-size: 32px;
// //                         font-weight: bold;
// //                         color: #0066cc;
// //                         letter-spacing: 5px;
// //                     }
// //                     .footer {
// //                         text-align: center;
// //                         padding-top: 20px;
// //                         border-top: 1px solid #ddd;
// //                         color: #666;
// //                         font-size: 14px;
// //                     }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="container">
// //                     <div class="header">
// //                         <div class="logo">🧳 Dev-Link</div>
// //                     </div>
// //                     <div class="content">
// //                         <h2>Email Verification</h2>
// //                         <p>Hello,</p>
// //                         <p>Thank you for signing up with Dev-link! To complete your registration and activate your account, please use the verification code below:</p>
// //                         <div class="code-box">
// //                             <div class="code">${safeCode}</div>
// //                         </div>
// //                         <p>This code will expire in <strong>15 minutes</strong>.</p>
// //                         <p>If you didn't create an account with us, please ignore this email.</p>
// //                     </div>
// //                     <div class="footer">
// //                         <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
// //                         <p>This email was sent to ${safeEmail}</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getPasswordResetEmailTemplate = (resetUrl: string, userEmail: string, resetToken: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };
    
// //     const safeResetUrl = escapeHtml(resetUrl);
// //     const safeEmail = escapeHtml(userEmail);
// //     const safeResetToken = escapeHtml(resetToken);
    
// //     return {
// //         subject: 'Reset Your Password - Dev-Link',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body {
// //                         font-family: Arial, sans-serif;
// //                         line-height: 1.6;
// //                         color: #333;
// //                     }
// //                     .container {
// //                         max-width: 600px;
// //                         margin: 0 auto;
// //                         padding: 20px;
// //                     }
// //                     .header {
// //                         text-align: center;
// //                         padding: 20px 0;
// //                         border-bottom: 2px solid #0066cc;
// //                     }
// //                     .logo {
// //                         font-size: 24px;
// //                         font-weight: bold;
// //                         color: #0066cc;
// //                     }
// //                     .content {
// //                         padding: 30px 0;
// //                     }
// //                     .button {
// //                         display: inline-block;
// //                         padding: 12px 30px;
// //                         background-color: #0066cc;
// //                         color: white;
// //                         text-decoration: none;
// //                         border-radius: 5px;
// //                         margin: 20px 0;
// //                     }
// //                     .footer {
// //                         text-align: center;
// //                         padding-top: 20px;
// //                         border-top: 1px solid #ddd;
// //                         color: #666;
// //                         font-size: 14px;
// //                     }
// //                     .warning {
// //                         background-color: #fff3cd;
// //                         border: 1px solid #ffc107;
// //                         border-radius: 5px;
// //                         padding: 15px;
// //                         margin: 20px 0;
// //                     }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="container">
// //                     <div class="header">
// //                         <div class="logo">🧳 Dev-Link</div>
// //                     </div>
// //                     <div class="content">
// //                         <h2>Reset Your Password</h2>
// //                         <p>Hello,</p>
// //                         <p>We received a request to reset your password. Enter the following token in the reset password page:</p>
// //                         <p style="word-break: break-all; color: #0066cc;">${safeResetToken}</p>
// //                         <p>Or click the button below to create a new password:</p>
// //                         <div style="text-align: center;">
// //                             <a href="${safeResetUrl}" class="button">Reset Password</a>
// //                         </div>
// //                         <p>Or copy and paste this link into your browser:</p>
// //                         <p style="word-break: break-all; color: #0066cc;">${safeResetUrl}</p>
// //                         <div class="warning">
// //                             <strong>⚠️ Security Notice:</strong>
// //                             <ul style="margin: 10px 0;">
// //                                 <li>This link will expire in <strong>1 hour</strong></li>
// //                                 <li>If you didn't request a password reset, please ignore this email</li>
// //                                 <li>Never share this link with anyone</li>
// //                             </ul>
// //                         </div>
// //                     </div>
// //                     <div class="footer">
// //                         <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
// //                         <p>This email was sent to ${safeEmail}</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getPasswordResetSuccessTemplate = (userEmail: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };
    
// //     const safeEmail = escapeHtml(userEmail);
    
// //     return {
// //         subject: 'Password Successfully Reset - Dev-Link',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body {
// //                         font-family: Arial, sans-serif;
// //                         line-height: 1.6;
// //                         color: #333;
// //                     }
// //                     .container {
// //                         max-width: 600px;
// //                         margin: 0 auto;
// //                         padding: 20px;
// //                     }
// //                     .header {
// //                         text-align: center;
// //                         padding: 20px 0;
// //                         border-bottom: 2px solid #0066cc;
// //                     }
// //                     .logo {
// //                         font-size: 24px;
// //                         font-weight: bold;
// //                         color: #0066cc;
// //                     }
// //                     .content {
// //                         padding: 30px 0;
// //                     }
// //                     .success {
// //                         background-color: #d4edda;
// //                         border: 1px solid #28a745;
// //                         border-radius: 5px;
// //                         padding: 15px;
// //                         margin: 20px 0;
// //                         text-align: center;
// //                     }
// //                     .footer {
// //                         text-align: center;
// //                         padding-top: 20px;
// //                         border-top: 1px solid #ddd;
// //                         color: #666;
// //                         font-size: 14px;
// //                     }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="container">
// //                     <div class="header">
// //                         <div class="logo">🧳 Dev-Link</div>
// //                     </div>
// //                     <div class="content">
// //                         <h2>Password Reset Successful</h2>
// //                         <div class="success">
// //                             <h3>✅ Your password has been successfully reset!</h3>
// //                         </div>
// //                         <p>Hello,</p>
// //                         <p>This is a confirmation that your password for your Dev-Link account has been changed.</p>
// //                         <p>If you did not make this change, please contact our support team immediately.</p>
// //                     </div>
// //                     <div class="footer">
// //                         <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
// //                         <p>This email was sent to ${safeEmail}</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getWelcomeEmailTemplate = (userName: string, userEmail: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };
    
// //     const safeName = escapeHtml(userName);
// //     const safeEmail = escapeHtml(userEmail);
    
// //     return {
// //         subject: 'Welcome to Dev-Link! 🎉',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body {
// //                         font-family: Arial, sans-serif;
// //                         line-height: 1.6;
// //                         color: #333;
// //                     }
// //                     .container {
// //                         max-width: 600px;
// //                         margin: 0 auto;
// //                         padding: 20px;
// //                     }
// //                     .header {
// //                         text-align: center;
// //                         padding: 20px 0;
// //                         border-bottom: 2px solid #0066cc;
// //                     }
// //                     .logo {
// //                         font-size: 24px;
// //                         font-weight: bold;
// //                         color: #0066cc;
// //                     }
// //                     .content {
// //                         padding: 30px 0;
// //                     }
// //                     .welcome-box {
// //                         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //                         border-radius: 12px;
// //                         padding: 30px;
// //                         text-align: center;
// //                         color: white;
// //                         margin: 20px 0;
// //                     }
// //                     .welcome-box h1 {
// //                         margin: 0;
// //                         font-size: 28px;
// //                     }
// //                     .feature-box {
// //                         background-color: #f8f9fa;
// //                         border-left: 4px solid #0066cc;
// //                         border-radius: 5px;
// //                         padding: 15px;
// //                         margin: 15px 0;
// //                     }
// //                     .feature-box h3 {
// //                         margin-top: 0;
// //                         color: #0066cc;
// //                     }
// //                     .cta-button {
// //                         display: inline-block;
// //                         padding: 15px 40px;
// //                         background-color: #0066cc;
// //                         color: white;
// //                         text-decoration: none;
// //                         border-radius: 5px;
// //                         margin: 20px 0;
// //                         font-weight: bold;
// //                     }
// //                     .footer {
// //                         text-align: center;
// //                         padding-top: 20px;
// //                         border-top: 1px solid #ddd;
// //                         color: #666;
// //                         font-size: 14px;
// //                     }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="container">
// //                     <div class="header">
// //                         <div class="logo">🧳 Dev-Link</div>
// //                     </div>
// //                     <div class="content">
// //                         <div class="welcome-box">
// //                             <h1>Welcome to Dev-Link! 🎉</h1>
// //                             <p style="font-size: 18px; margin: 10px 0 0 0;">We're excited to have you on board, ${safeName}!</p>
// //                         </div>
                        
// //                         <p>Hello ${safeName},</p>
// //                         <p>Thank you for joining Dev-Link - your gateway to connecting talented developers with amazing opportunities!</p>
                        
// //                         <h2 style="color: #0066cc;">Getting Started</h2>
                        
// //                         <div class="feature-box">
// //                             <h3>📝 Complete Your Profile</h3>
// //                             <p>Add your skills, experience, and what you're looking for to stand out to potential employers.</p>
// //                         </div>
                        
// //                         <div class="feature-box">
// //                             <h3>🔍 Browse Opportunities</h3>
// //                             <p>Explore thousands of job listings from companies looking for talent like you.</p>
// //                         </div>
                        
// //                         <div class="feature-box">
// //                             <h3>🤝 Connect & Network</h3>
// //                             <p>Build meaningful connections with employers and fellow developers in the community.</p>
// //                         </div>
                        
// //                         <div style="text-align: center; margin: 30px 0;">
// //                             <a href="#" class="cta-button">Complete Your Profile</a>
// //                         </div>
                        
// //                         <h3>Need Help?</h3>
// //                         <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out anytime!</p>
                        
// //                         <p style="margin-top: 30px;">Best regards,<br><strong>The Dev-Link Team</strong></p>
// //                     </div>
// //                     <div class="footer">
// //                         <p>&copy; ${new Date().getFullYear()} Dev-Link. All rights reserved.</p>
// //                         <p>This email was sent to ${safeEmail}</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getVerificationEmailTemplate = (code: string, userEmail: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };

// //     const safeCode = escapeHtml(code);
// //     const safeEmail = escapeHtml(userEmail);

// //     return {
// //         subject: 'Verify your email',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
// //                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
// //                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
// //                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
// //                     .email-wrapper { max-width: 560px; margin: 0 auto; padding: 48px 24px 32px; }
// //                     .logo-area { text-align: center; padding: 0 0 40px; }
// //                     /* Replace the .logo-mark div below with <img src="YOUR_LOGO_URL" alt="Event VNV" width="140" style="display:inline-block;" /> */
// //                     .logo-mark { display: inline-block; }
// //                     .logo-mark svg { display: block; }
// //                     .card { background-color: #ffffff; border-radius: 16px; padding: 40px 36px; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); }
// //                     .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #1a1f3c; line-height: 1.3; }
// //                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1f3c; margin: 0 0 16px; line-height: 1.7; }
// //                     .code-container { background-color: #f6f3ec; border-radius: 12px; padding: 28px 24px; text-align: center; margin: 28px 0; }
// //                     .code-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; }
// //                     .code-value { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #1a1f3c; letter-spacing: 8px; margin: 0; }
// //                     .subtext { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; margin: 0 0 0; }
// //                     .divider { height: 1px; background-color: #f5e6c8; margin: 28px 0; border: none; }
// //                     .help-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #9ca3af; margin: 0; line-height: 1.6; }
// //                     .footer { text-align: center; padding: 32px 0 0; }
// //                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0 0 4px; }
// //                     .footer-link { color: #d65c3a; text-decoration: none; }
// //                     .footer-links { margin: 16px 0 0; }
// //                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; text-decoration: none; margin: 0 12px; }
// //                     .footer-links a:hover { color: #d65c3a; }
// //                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #b0b5c3; margin: 16px 0 0; }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="email-wrapper">
// //                     <div class="logo-area">
// //                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="140" style="display:inline-block;" />
// //                     </div>

// //                     <div class="card">
// //                         <h1 class="greeting">Verify your email</h1>
// //                         <p class="body-text">Welcome to Event VNV! To get started, please confirm your email address by entering the code below.</p>

// //                         <div class="code-container">
// //                             <p class="code-label">Verification Code</p>
// //                             <p class="code-value">${safeCode}</p>
// //                         </div>

// //                         <p class="subtext">This code expires in <strong>15 minutes</strong>.</p>

// //                         <hr class="divider" />

// //                         <p class="help-text">If you didn't create an account with Event VNV, you can safely ignore this email.</p>
// //                     </div>

// //                     <div class="footer">
// //                         <p class="footer-text">Sent to ${safeEmail}</p>
// //                         <div class="footer-links">
// //                             <a href="mailto:support@eventvnv.com">Help & Support</a>
// //                             <a href="#">Privacy Policy</a>
// //                             <a href="#">Terms of Service</a>
// //                         </div>
// //                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getPasswordResetEmailTemplate = (resetUrl: string, userEmail: string, resetToken: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };

// //     const safeResetUrl = escapeHtml(resetUrl);
// //     const safeEmail = escapeHtml(userEmail);
// //     const safeResetToken = escapeHtml(resetToken);

// //     return {
// //         subject: 'Reset your password',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
// //                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
// //                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
// //                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
// //                     .email-wrapper { max-width: 560px; margin: 0 auto; padding: 48px 24px 32px; }
// //                     .logo-area { text-align: center; padding: 0 0 40px; }
// //                     .logo-mark { display: inline-block; }
// //                     .logo-mark svg { display: block; }
// //                     .card { background-color: #ffffff; border-radius: 16px; padding: 40px 36px; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); }
// //                     .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #1a1f3c; line-height: 1.3; }
// //                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1f3c; margin: 0 0 16px; line-height: 1.7; }
// //                     .cta-wrapper { text-align: center; margin: 32px 0; }
// //                     .cta-button { display: inline-block; padding: 14px 40px; background-color: #d65c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: 0.2px; }
// //                     .cta-button:hover { background-color: #c04e2e; }
// //                     .fallback-link { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 13px; color: #d65c3a; word-break: break-all; margin: 0; line-height: 1.6; }
// //                     .token-box { background-color: #f6f3ec; border-radius: 12px; padding: 20px 24px; text-align: center; margin: 24px 0; }
// //                     .token-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px; }
// //                     .token-value { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 16px; font-weight: 600; color: #1a1f3c; word-break: break-all; margin: 0; }
// //                     .divider { height: 1px; background-color: #f5e6c8; margin: 28px 0; border: none; }
// //                     .notice-box { background-color: #f6f3ec; border-radius: 10px; padding: 20px 24px; margin: 0; }
// //                     .notice-box p { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; margin: 0; line-height: 1.7; }
// //                     .notice-box strong { color: #1a1f3c; }
// //                     .footer { text-align: center; padding: 32px 0 0; }
// //                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0 0 4px; }
// //                     .footer-links { margin: 16px 0 0; }
// //                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; text-decoration: none; margin: 0 12px; }
// //                     .footer-links a:hover { color: #d65c3a; }
// //                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #b0b5c3; margin: 16px 0 0; }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="email-wrapper">
// //                     <div class="logo-area">
// //                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="140" style="display:inline-block;" />
// //                     </div>

// //                     <div class="card">
// //                         <h1 class="greeting">Reset your password</h1>
// //                         <p class="body-text">We received a request to reset the password for your Event VNV account. Click the button below to choose a new one.</p>

// //                         <div class="cta-wrapper">
// //                             <a href="${safeResetUrl}" class="cta-button">Reset Password</a>
// //                         </div>

// //                         <p class="body-text" style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">If the button doesn't work, copy and paste this link into your browser:</p>
// //                         <p class="fallback-link">${safeResetUrl}</p>

// //                         <hr class="divider" />

// //                         <p class="body-text" style="margin-bottom: 12px; font-size: 15px;">Or enter this token on the reset page:</p>
// //                         <div class="token-box">
// //                             <p class="token-label">Reset Token</p>
// //                             <p class="token-value">${safeResetToken}</p>
// //                         </div>

// //                         <hr class="divider" />

// //                         <div class="notice-box">
// //                             <p><strong>This link expires in 1 hour.</strong><br />If you didn't request a password reset, you can safely ignore this email — your account is secure.</p>
// //                         </div>
// //                     </div>

// //                     <div class="footer">
// //                         <p class="footer-text">Sent to ${safeEmail}</p>
// //                         <div class="footer-links">
// //                             <a href="mailto:support@eventvnv.com">Help & Support</a>
// //                             <a href="#">Privacy Policy</a>
// //                             <a href="#">Terms of Service</a>
// //                         </div>
// //                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getPasswordResetSuccessTemplate = (userEmail: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };

// //     const safeEmail = escapeHtml(userEmail);

// //     return {
// //         subject: 'Your password has been updated',
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
// //                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
// //                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
// //                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
// //                     .email-wrapper { max-width: 560px; margin: 0 auto; padding: 48px 24px 32px; }
// //                     .logo-area { text-align: center; padding: 0 0 40px; }
// //                     .logo-mark { display: inline-block; }
// //                     .logo-mark svg { display: block; }
// //                     .card { background-color: #ffffff; border-radius: 16px; padding: 40px 36px; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); }
// //                     .icon-circle { width: 56px; height: 56px; background-color: #f6f3ec; border-radius: 50%; text-align: center; line-height: 56px; margin: 0 0 20px; }
// //                     .icon-circle svg { vertical-align: middle; }
// //                     .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #1a1f3c; line-height: 1.3; }
// //                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1f3c; margin: 0 0 16px; line-height: 1.7; }
// //                     .divider { height: 1px; background-color: #f5e6c8; margin: 28px 0; border: none; }
// //                     .help-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #9ca3af; margin: 0; line-height: 1.6; }
// //                     .help-text a { color: #d65c3a; text-decoration: none; }
// //                     .footer { text-align: center; padding: 32px 0 0; }
// //                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0 0 4px; }
// //                     .footer-links { margin: 16px 0 0; }
// //                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; text-decoration: none; margin: 0 12px; }
// //                     .footer-links a:hover { color: #d65c3a; }
// //                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #b0b5c3; margin: 16px 0 0; }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="email-wrapper">
// //                     <div class="logo-area">
// //                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="140" style="display:inline-block;" />
// //                     </div>

// //                     <div class="card">
// //                         <div class="icon-circle">
// //                             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d65c3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
// //                                 <polyline points="20 6 9 17 4 12"></polyline>
// //                             </svg>
// //                         </div>

// //                         <h1 class="greeting">Password updated</h1>
// //                         <p class="body-text">Your Event VNV password has been successfully changed. You can now sign in with your new password.</p>

// //                         <hr class="divider" />

// //                         <p class="help-text">If you didn't make this change, please contact us immediately at <a href="mailto:support@eventvnv.com">support@eventvnv.com</a>.</p>
// //                     </div>

// //                     <div class="footer">
// //                         <p class="footer-text">Sent to ${safeEmail}</p>
// //                         <div class="footer-links">
// //                             <a href="mailto:support@eventvnv.com">Help & Support</a>
// //                             <a href="#">Privacy Policy</a>
// //                             <a href="#">Terms of Service</a>
// //                         </div>
// //                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };

// // export const getWelcomeEmailTemplate = (userName: string, userEmail: string) => {
// //     const escapeHtml = (s: string = "") => {
// //         return String(s).replace(/[&<>"'\/]/g, (c) => ({
// //             '&': '&amp;',
// //             '<': '&lt;',
// //             '>': '&gt;',
// //             '"': '&quot;',
// //             "'": '&#39;',
// //             '/': '&#x2F;',
// //         }[c] || c));
// //     };

// //     const safeName = escapeHtml(userName);
// //     const safeEmail = escapeHtml(userEmail);

// //     return {
// //         subject: `Welcome to Event VNV, ${safeName}`,
// //         html: `
// //             <!DOCTYPE html>
// //             <html>
// //             <head>
// //                 <style>
// //                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
// //                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
// //                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
// //                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
// //                     .email-wrapper { max-width: 560px; margin: 0 auto; padding: 48px 24px 32px; }
// //                     .logo-area { text-align: center; padding: 0 0 40px; }
// //                     .logo-mark { display: inline-block; }
// //                     .logo-mark svg { display: block; }
// //                     .card { background-color: #ffffff; border-radius: 16px; padding: 0; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); overflow: hidden; }
// //                     .hero { background-color: #1a1f3c; padding: 40px 36px 36px; text-align: center; }
// //                     .hero-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px; }
// //                     .hero-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 600; margin: 0 0 8px; color: #ffffff; line-height: 1.3; }
// //                     .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.5; }
// //                     .card-body { padding: 36px; }
// //                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1f3c; margin: 0 0 28px; line-height: 1.7; }
// //                     .step { padding: 0 0 24px; border-bottom: 1px solid #f5e6c8; }
// //                     .step:last-child { border-bottom: none; padding-bottom: 0; }
// //                     .step-header { margin: 0 0 6px; }
// //                     .step-icon { display: inline-block; width: 28px; height: 28px; background-color: #f6f3ec; border-radius: 50%; text-align: center; line-height: 28px; vertical-align: middle; margin-right: 10px; }
// //                     .step-icon span { font-size: 14px; }
// //                     .step-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #1a1f3c; vertical-align: middle; }
// //                     .step-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6; padding-left: 38px; }
// //                     .cta-wrapper { text-align: center; margin: 32px 0 0; }
// //                     .cta-button { display: inline-block; padding: 14px 40px; background-color: #d65c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: 0.2px; }
// //                     .cta-button:hover { background-color: #c04e2e; }
// //                     .sign-off { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 32px 0 0; line-height: 1.6; }
// //                     .sign-off strong { font-weight: 600; }
// //                     .footer { text-align: center; padding: 32px 0 0; }
// //                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0 0 4px; }
// //                     .footer-links { margin: 16px 0 0; }
// //                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; text-decoration: none; margin: 0 12px; }
// //                     .footer-links a:hover { color: #d65c3a; }
// //                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #b0b5c3; margin: 16px 0 0; }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="email-wrapper">
// //                    <div class="logo-area">
// //                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="140" style="display:inline-block;" />
// //                     </div>

// //                     <div class="card">
// //                         <div class="hero">
// //                             <p class="hero-label">You're in</p>
// //                             <h1 class="hero-title">Welcome, ${safeName}</h1>
// //                             <p class="hero-subtitle">We're glad you're here. Let's get you set up.</p>
// //                         </div>

// //                         <div class="card-body">
// //                             <p class="body-text">Your Event VNV account is ready. Here's how to make the most of it:</p>

// //                             <div class="step">
// //                                 <div class="step-header">
// //                                     <span class="step-icon"><span>1</span></span>
// //                                     <span class="step-title">Complete your profile</span>
// //                                 </div>
// //                                 <p class="step-desc">Add your details so others can find and connect with you at events.</p>
// //                             </div>

// //                             <div class="step">
// //                                 <div class="step-header">
// //                                     <span class="step-icon"><span>2</span></span>
// //                                     <span class="step-title">Discover events</span>
// //                                 </div>
// //                                 <p class="step-desc">Browse upcoming events, save the ones you like, and RSVP in seconds.</p>
// //                             </div>

// //                             <div class="step">
// //                                 <div class="step-header">
// //                                     <span class="step-icon"><span>3</span></span>
// //                                     <span class="step-title">Connect with people</span>
// //                                 </div>
// //                                 <p class="step-desc">Meet attendees, speakers, and organizers — build real relationships.</p>
// //                             </div>

// //                             <div class="cta-wrapper">
// //                                 <a href="#" class="cta-button">Set up your profile</a>
// //                             </div>

// //                             <p class="sign-off">Questions? We're always here at <strong><a href="mailto:support@eventvnv.com" style="color: #d65c3a; text-decoration: none;">support@eventvnv.com</a></strong>.<br /><br />Warmly,<br /><strong>The Event VNV Team</strong></p>
// //                         </div>
// //                     </div>

// //                     <div class="footer">
// //                         <p class="footer-text">Sent to ${safeEmail}</p>
// //                         <div class="footer-links">
// //                             <a href="mailto:support@eventvnv.com">Help & Support</a>
// //                             <a href="#">Privacy Policy</a>
// //                             <a href="#">Terms of Service</a>
// //                         </div>
// //                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
// //                     </div>
// //                 </div>
// //             </body>
// //             </html>
// //         `
// //     };
// // };


// export const getVerificationEmailTemplate = (code: string, userEmail: string) => {
//     const escapeHtml = (s: string = "") => {
//         return String(s).replace(/[&<>"'\/]/g, (c) => ({
//             '&': '&amp;',
//             '<': '&lt;',
//             '>': '&gt;',
//             '"': '&quot;',
//             "'": '&#39;',
//             '/': '&#x2F;',
//         }[c] || c));
//     };

//     const safeCode = escapeHtml(code);
//     const safeEmail = escapeHtml(userEmail);

//     return {
//         subject: 'Verify your email',
//         html: `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
//                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
//                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
//                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
//                     .email-wrapper { max-width: 680px; margin: 0 auto; padding: 32px 24px 24px; }
//                     .logo-area { text-align: center; padding: 0 0 16px; }
//                     .card { background-color: #ffffff; border-radius: 16px; padding: 28px 32px; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); }
//                     .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 6px; color: #1a1f3c; line-height: 1.3; }
//                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 12px; line-height: 1.6; }
//                     .code-container { background-color: #f6f3ec; border-radius: 12px; padding: 22px 24px; text-align: center; margin: 20px 0; }
//                     .code-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px; }
//                     .code-value { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; color: #1a1f3c; letter-spacing: 8px; margin: 0; }
//                     .subtext { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; }
//                     .divider { height: 1px; background-color: #f5e6c8; margin: 20px 0; border: none; }
//                     .help-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; line-height: 1.5; }
//                     .footer { text-align: center; padding: 24px 0 0; }
//                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
//                     .footer-link { color: #d65c3a; text-decoration: none; }
//                     .footer-links { margin: 12px 0 0; }
//                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
//                     .footer-links a:hover { color: #d65c3a; }
//                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 12px 0 0; }
//                 </style>
//             </head>
//             <body>
//                 <div class="email-wrapper">
//                     <div class="logo-area">
//                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="80" style="display:inline-block;" />
//                     </div>

//                     <div class="card">
//                         <h1 class="greeting">Verify your email</h1>
//                         <p class="body-text">Welcome to Event VNV! To get started, please confirm your email address by entering the code below.</p>

//                         <div class="code-container">
//                             <p class="code-label">Verification Code</p>
//                             <p class="code-value">${safeCode}</p>
//                         </div>

//                         <p class="subtext">This code expires in <strong>15 minutes</strong>.</p>

//                         <hr class="divider" />

//                         <p class="help-text">If you didn't create an account with Event VNV, you can safely ignore this email.</p>
//                     </div>

//                     <div class="footer">
//                         <p class="footer-text">Sent to ${safeEmail}</p>
//                         <div class="footer-links">
//                             <a href="mailto:support@eventvnv.com">Help & Support</a>
//                             <a href="#">Privacy Policy</a>
//                             <a href="#">Terms of Service</a>
//                         </div>
//                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `
//     };
// };

// export const getPasswordResetEmailTemplate = (resetUrl: string, userEmail: string, resetToken: string) => {
//     const escapeHtml = (s: string = "") => {
//         return String(s).replace(/[&<>"'\/]/g, (c) => ({
//             '&': '&amp;',
//             '<': '&lt;',
//             '>': '&gt;',
//             '"': '&quot;',
//             "'": '&#39;',
//             '/': '&#x2F;',
//         }[c] || c));
//     };

//     const safeResetUrl = escapeHtml(resetUrl);
//     const safeEmail = escapeHtml(userEmail);
//     const safeResetToken = escapeHtml(resetToken);

//     return {
//         subject: 'Reset your password',
//         html: `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
//                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
//                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
//                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
//                     .email-wrapper { max-width: 680px; margin: 0 auto; padding: 32px 24px 24px; }
//                     .logo-area { text-align: center; padding: 0 0 16px; }
//                     .card { background-color: #ffffff; border-radius: 16px; padding: 28px 32px; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); }
//                     .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 6px; color: #1a1f3c; line-height: 1.3; }
//                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 12px; line-height: 1.6; }
//                     .token-box { background-color: #f6f3ec; border-radius: 12px; padding: 18px 24px; text-align: center; margin: 20px 0; }
//                     .token-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px; }
//                     .token-value { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 15px; font-weight: 600; color: #1a1f3c; word-break: break-all; margin: 0; }
//                     .cta-wrapper { text-align: center; margin: 24px 0; }
//                     .cta-button { display: inline-block; padding: 12px 36px; background-color: #d65c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
//                     .cta-button:hover { background-color: #c04e2e; }
//                     .fallback-link { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 12px; color: #d65c3a; word-break: break-all; margin: 0; line-height: 1.5; }
//                     .divider { height: 1px; background-color: #f5e6c8; margin: 20px 0; border: none; }
//                     .notice-box { background-color: #f6f3ec; border-radius: 10px; padding: 16px 20px; margin: 0; }
//                     .notice-box p { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6; }
//                     .notice-box strong { color: #1a1f3c; }
//                     .footer { text-align: center; padding: 24px 0 0; }
//                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
//                     .footer-links { margin: 12px 0 0; }
//                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
//                     .footer-links a:hover { color: #d65c3a; }
//                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 12px 0 0; }
//                 </style>
//             </head>
//             <body>
//                 <div class="email-wrapper">
//                     <div class="logo-area">
//                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="80" style="display:inline-block;" />
//                     </div>

//                     <div class="card">
//                         <h1 class="greeting">Reset your password</h1>
//                         <p class="body-text">We received a request to reset the password for your Event VNV account. Use the token below or click the button to choose a new one.</p>

//                         <div class="token-box">
//                             <p class="token-label">Reset Token</p>
//                             <p class="token-value">${safeResetToken}</p>
//                         </div>

//                         <div class="cta-wrapper">
//                             <a href="${safeResetUrl}" class="cta-button">Reset Password</a>
//                         </div>

//                         <p class="body-text" style="font-size: 13px; color: #6b7280; margin-bottom: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
//                         <p class="fallback-link">${safeResetUrl}</p>

//                         <hr class="divider" />

//                         <div class="notice-box">
//                             <p><strong>This link expires in 1 hour.</strong><br />If you didn't request a password reset, you can safely ignore this email — your account is secure.</p>
//                         </div>
//                     </div>

//                     <div class="footer">
//                         <p class="footer-text">Sent to ${safeEmail}</p>
//                         <div class="footer-links">
//                             <a href="mailto:support@eventvnv.com">Help & Support</a>
//                             <a href="#">Privacy Policy</a>
//                             <a href="#">Terms of Service</a>
//                         </div>
//                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `
//     };
// };

// export const getPasswordResetSuccessTemplate = (userEmail: string) => {
//     const escapeHtml = (s: string = "") => {
//         return String(s).replace(/[&<>"'\/]/g, (c) => ({
//             '&': '&amp;',
//             '<': '&lt;',
//             '>': '&gt;',
//             '"': '&quot;',
//             "'": '&#39;',
//             '/': '&#x2F;',
//         }[c] || c));
//     };

//     const safeEmail = escapeHtml(userEmail);

//     return {
//         subject: 'Your password has been updated',
//         html: `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
//                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
//                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
//                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
//                     .email-wrapper { max-width: 680px; margin: 0 auto; padding: 32px 24px 24px; }
//                     .logo-area { text-align: center; padding: 0 0 16px; }
//                     .card { background-color: #ffffff; border-radius: 16px; padding: 28px 32px; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); }
//                     .icon-circle { width: 48px; height: 48px; background-color: #f6f3ec; border-radius: 50%; text-align: center; line-height: 48px; margin: 0 0 16px; }
//                     .icon-circle svg { vertical-align: middle; }
//                     .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 6px; color: #1a1f3c; line-height: 1.3; }
//                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 12px; line-height: 1.6; }
//                     .divider { height: 1px; background-color: #f5e6c8; margin: 20px 0; border: none; }
//                     .help-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; line-height: 1.5; }
//                     .help-text a { color: #d65c3a; text-decoration: none; }
//                     .footer { text-align: center; padding: 24px 0 0; }
//                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
//                     .footer-links { margin: 12px 0 0; }
//                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
//                     .footer-links a:hover { color: #d65c3a; }
//                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 12px 0 0; }
//                 </style>
//             </head>
//             <body>
//                 <div class="email-wrapper">
//                     <div class="logo-area">
//                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="80" style="display:inline-block;" />
//                     </div>

//                     <div class="card">
//                         <div class="icon-circle">
//                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d65c3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
//                                 <polyline points="20 6 9 17 4 12"></polyline>
//                             </svg>
//                         </div>

//                         <h1 class="greeting">Password updated</h1>
//                         <p class="body-text">Your Event VNV password has been successfully changed. You can now sign in with your new password.</p>

//                         <hr class="divider" />

//                         <p class="help-text">If you didn't make this change, please contact us immediately at <a href="mailto:support@eventvnv.com">support@eventvnv.com</a>.</p>
//                     </div>

//                     <div class="footer">
//                         <p class="footer-text">Sent to ${safeEmail}</p>
//                         <div class="footer-links">
//                             <a href="mailto:support@eventvnv.com">Help & Support</a>
//                             <a href="#">Privacy Policy</a>
//                             <a href="#">Terms of Service</a>
//                         </div>
//                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `
//     };
// };

// export const getWelcomeEmailTemplate = (userName: string, userEmail: string) => {
//     const escapeHtml = (s: string = "") => {
//         return String(s).replace(/[&<>"'\/]/g, (c) => ({
//             '&': '&amp;',
//             '<': '&lt;',
//             '>': '&gt;',
//             '"': '&quot;',
//             "'": '&#39;',
//             '/': '&#x2F;',
//         }[c] || c));
//     };

//     const safeName = escapeHtml(userName);
//     const safeEmail = escapeHtml(userEmail);

//     return {
//         subject: `Welcome to Event VNV, ${safeName}`,
//         html: `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
//                     table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
//                     img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
//                     body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
//                     .email-wrapper { max-width: 680px; margin: 0 auto; padding: 32px 24px 24px; }
//                     .logo-area { text-align: center; padding: 0 0 16px; }
//                     .card { background-color: #ffffff; border-radius: 16px; padding: 0; box-shadow: 0 2px 12px rgba(26, 31, 60, 0.06); overflow: hidden; }
//                     .hero { background-color: #1a1f3c; padding: 28px 32px 24px; text-align: center; }
//                     .hero-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px; }
//                     .hero-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 6px; color: #ffffff; line-height: 1.3; }
//                     .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.5; }
//                     .card-body { padding: 28px 32px; }
//                     .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 20px; line-height: 1.6; }
//                     .step { padding: 0 0 16px; border-bottom: 1px solid #f5e6c8; }
//                     .step:last-child { border-bottom: none; padding-bottom: 0; }
//                     .step-header { margin: 0 0 4px; }
//                     .step-icon { display: inline-block; width: 24px; height: 24px; background-color: #f6f3ec; border-radius: 50%; text-align: center; line-height: 24px; vertical-align: middle; margin-right: 10px; }
//                     .step-icon span { font-size: 12px; }
//                     .step-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1f3c; vertical-align: middle; }
//                     .step-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; padding-left: 34px; }
//                     .cta-wrapper { text-align: center; margin: 24px 0 0; }
//                     .cta-button { display: inline-block; padding: 12px 36px; background-color: #d65c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
//                     .cta-button:hover { background-color: #c04e2e; }
//                     .sign-off { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1f3c; margin: 24px 0 0; line-height: 1.5; }
//                     .sign-off strong { font-weight: 600; }
//                     .footer { text-align: center; padding: 24px 0 0; }
//                     .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
//                     .footer-links { margin: 12px 0 0; }
//                     .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
//                     .footer-links a:hover { color: #d65c3a; }
//                     .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 12px 0 0; }
//                 </style>
//             </head>
//             <body>
//                 <div class="email-wrapper">
//                     <div class="logo-area">
//                         <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781889744/logo_tedygp.png" alt="Event VNV" width="80" style="display:inline-block;" />
//                     </div>

//                     <div class="card">
//                         <div class="hero">
//                             <p class="hero-label">You're in</p>
//                             <h1 class="hero-title">Welcome, ${safeName}</h1>
//                             <p class="hero-subtitle">We're glad you're here. Let's get you set up.</p>
//                         </div>

//                         <div class="card-body">
//                             <p class="body-text">Your Event VNV account is ready. Here's how to make the most of it:</p>

//                             <div class="step">
//                                 <div class="step-header">
//                                     <span class="step-icon"><span>1</span></span>
//                                     <span class="step-title">Complete your profile</span>
//                                 </div>
//                                 <p class="step-desc">Add your details so others can find and connect with you at events.</p>
//                             </div>

//                             <div class="step">
//                                 <div class="step-header">
//                                     <span class="step-icon"><span>2</span></span>
//                                     <span class="step-title">Discover events</span>
//                                 </div>
//                                 <p class="step-desc">Browse upcoming events, save the ones you like, and RSVP in seconds.</p>
//                             </div>

//                             <div class="step">
//                                 <div class="step-header">
//                                     <span class="step-icon"><span>3</span></span>
//                                     <span class="step-title">Connect with people</span>
//                                 </div>
//                                 <p class="step-desc">Meet attendees, speakers, and organizers — build real relationships.</p>
//                             </div>

//                             <div class="cta-wrapper">
//                                 <a href="#" class="cta-button">Set up your profile</a>
//                             </div>

//                             <p class="sign-off">Questions? We're always here at <strong><a href="mailto:support@eventvnv.com" style="color: #d65c3a; text-decoration: none;">support@eventvnv.com</a></strong>.<br /><br />Warmly,<br /><strong>The Event VNV Team</strong></p>
//                         </div>
//                     </div>

//                     <div class="footer">
//                         <p class="footer-text">Sent to ${safeEmail}</p>
//                         <div class="footer-links">
//                             <a href="mailto:support@eventvnv.com">Help & Support</a>
//                             <a href="#">Privacy Policy</a>
//                             <a href="#">Terms of Service</a>
//                         </div>
//                         <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `
//     };
// };


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
        subject: 'Verify your email',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
                    .email-wrapper { max-width: 100%; padding: 0; }
                    .logo-area { text-align: center; padding: 24px 0 12px; }
                    .card { background-color: #ffffff; border-radius: 0; padding: 24px 32px; box-shadow: none; }
                    .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 6px; color: #1a1f3c; line-height: 1.3; }
                    .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 12px; line-height: 1.6; }
                    .code-container { background-color: #f6f3ec; border-radius: 12px; padding: 28px 24px; text-align: center; margin: 20px 0; }
                    .code-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; }
                    .code-value { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 56px; font-weight: 700; color: #1a1f3c; letter-spacing: 12px; margin: 0; }
                    .subtext { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; }
                    .divider { height: 1px; background-color: #f5e6c8; margin: 20px 0; border: none; }
                    .help-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; line-height: 1.5; }
                    .footer { text-align: center; padding: 20px 32px 0; }
                    .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
                    .footer-link { color: #d65c3a; text-decoration: none; }
                    .footer-links { margin: 10px 0 0; }
                    .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
                    .footer-links a:hover { color: #d65c3a; }
                    .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 10px 0 0; }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="logo-area">
                        <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781892368/logoorange_lunymd.png" alt="Event VNV" width="80" style="display:inline-block;" />
                    </div>

                    <div class="card">
                        <h1 class="greeting">Verify your email</h1>
                        <p class="body-text">Welcome to Event VNV! To get started, please confirm your email address by entering the code below.</p>

                        <div class="code-container">
                            <p class="code-label">Verification Code</p>
                            <p class="code-value">${safeCode}</p>
                        </div>

                        <p class="subtext">This code expires in <strong>15 minutes</strong>.</p>

                        <hr class="divider" />

                        <p class="help-text">If you didn't create an account with Event VNV, you can safely ignore this email.</p>
                    </div>

                    <div class="footer">
                        <p class="footer-text">Sent to ${safeEmail}</p>
                        <div class="footer-links">
                            <a href="mailto:support@eventvnv.com">Help & Support</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export const getPasswordResetEmailTemplate = (resetUrl: string, userEmail: string, resetToken: string) => {
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
    const safeResetToken = escapeHtml(resetToken);

    return {
        subject: 'Reset your password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
                    .email-wrapper { max-width: 100%; padding: 0; }
                    .logo-area { text-align: center; padding: 24px 0 12px; }
                    .card { background-color: #ffffff; border-radius: 0; padding: 24px 32px; box-shadow: none; }
                    .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 6px; color: #1a1f3c; line-height: 1.3; }
                    .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 12px; line-height: 1.6; }
                    .token-box { background-color: #f6f3ec; border-radius: 12px; padding: 24px 24px; text-align: center; margin: 20px 0; }
                    .token-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px; }
                    .token-value { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #1a1f3c; word-break: break-all; letter-spacing: 6px; margin: 0; }
                    .fallback-link { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace; font-size: 12px; color: #d65c3a; word-break: break-all; margin: 0; line-height: 1.5; }
                    .cta-wrapper { text-align: center; margin: 20px 0; }
                    .cta-button { display: inline-block; padding: 12px 36px; background-color: #d65c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
                    .cta-button:hover { background-color: #c04e2e; }
                    .divider { height: 1px; background-color: #f5e6c8; margin: 20px 0; border: none; }
                    .notice-box { background-color: #f6f3ec; border-radius: 10px; padding: 16px 20px; margin: 0; }
                    .notice-box p { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6; }
                    .notice-box strong { color: #1a1f3c; }
                    .footer { text-align: center; padding: 20px 32px 0; }
                    .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
                    .footer-links { margin: 10px 0 0; }
                    .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
                    .footer-links a:hover { color: #d65c3a; }
                    .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 10px 0 0; }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="logo-area">
                        <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781892368/logoorange_lunymd.png" alt="Event VNV" width="80" style="display:inline-block;" />
                    </div>

                    <div class="card">
                        <h1 class="greeting">Reset your password</h1>
                        <p class="body-text">We received a request to reset the password for your Event VNV account. Use the token below or click the button to choose a new one.</p>

                        <div class="token-box">
                            <p class="token-label">Reset Token</p>
                            <p class="token-value">${safeResetToken}</p>
                        </div>

                        <p class="body-text" style="font-size: 13px; color: #6b7280; margin-bottom: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p class="fallback-link">${safeResetUrl}</p>

                        <div class="cta-wrapper">
                            <a href="${safeResetUrl}" class="cta-button">Reset Password</a>
                        </div>

                        <hr class="divider" />

                        <div class="notice-box">
                            <p><strong>This link expires in 1 hour.</strong><br />If you didn't request a password reset, you can safely ignore this email — your account is secure.</p>
                        </div>
                    </div>

                    <div class="footer">
                        <p class="footer-text">Sent to ${safeEmail}</p>
                        <div class="footer-links">
                            <a href="mailto:support@eventvnv.com">Help & Support</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
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
        subject: 'Your password has been updated',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
                    .email-wrapper { max-width: 100%; padding: 0; }
                    .logo-area { text-align: center; padding: 24px 0 12px; }
                    .card { background-color: #ffffff; border-radius: 0; padding: 24px 32px; box-shadow: none; }
                    .icon-circle { width: 48px; height: 48px; background-color: #f6f3ec; border-radius: 50%; text-align: center; line-height: 48px; margin: 0 0 16px; }
                    .icon-circle svg { vertical-align: middle; }
                    .greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 6px; color: #1a1f3c; line-height: 1.3; }
                    .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 12px; line-height: 1.6; }
                    .divider { height: 1px; background-color: #f5e6c8; margin: 20px 0; border: none; }
                    .help-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; line-height: 1.5; }
                    .help-text a { color: #d65c3a; text-decoration: none; }
                    .footer { text-align: center; padding: 20px 32px 0; }
                    .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
                    .footer-links { margin: 10px 0 0; }
                    .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
                    .footer-links a:hover { color: #d65c3a; }
                    .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 10px 0 0; }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="logo-area">
                        <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781892368/logoorange_lunymd.png" alt="Event VNV" width="80" style="display:inline-block;" />
                    </div>

                    <div class="card">
                        <div class="icon-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d65c3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>

                        <h1 class="greeting">Password updated</h1>
                        <p class="body-text">Your Event VNV password has been successfully changed. You can now sign in with your new password.</p>

                        <hr class="divider" />

                        <p class="help-text">If you didn't make this change, please contact us immediately at <a href="mailto:support@eventvnv.com">support@eventvnv.com</a>.</p>
                    </div>

                    <div class="footer">
                        <p class="footer-text">Sent to ${safeEmail}</p>
                        <div class="footer-links">
                            <a href="mailto:support@eventvnv.com">Help & Support</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
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
        subject: `Welcome to Event VNV, ${safeName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f6ef; }
                    .email-wrapper { max-width: 100%; padding: 0; }
                    .logo-area { text-align: center; padding: 24px 0 12px; }
                    .card { background-color: #ffffff; border-radius: 0; padding: 0; box-shadow: none; overflow: hidden; }
                    .hero { background-color: #1a1f3c; padding: 28px 32px 24px; text-align: center; }
                    .hero-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #c9993a; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px; }
                    .hero-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 6px; color: #ffffff; line-height: 1.3; }
                    .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.5; }
                    .card-body { padding: 24px 32px; }
                    .body-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1f3c; margin: 0 0 20px; line-height: 1.6; }
                    .step { padding: 0 0 16px; border-bottom: 1px solid #f5e6c8; }
                    .step:last-child { border-bottom: none; padding-bottom: 0; }
                    .step-header { margin: 0 0 4px; }
                    .step-icon { display: inline-block; width: 24px; height: 24px; background-color: #f6f3ec; border-radius: 50%; text-align: center; line-height: 24px; vertical-align: middle; margin-right: 10px; }
                    .step-icon span { font-size: 12px; }
                    .step-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1f3c; vertical-align: middle; }
                    .step-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; padding-left: 34px; }
                    .cta-wrapper { text-align: center; margin: 24px 0 0; }
                    .cta-button { display: inline-block; padding: 12px 36px; background-color: #d65c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
                    .cta-button:hover { background-color: #c04e2e; }
                    .sign-off { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1f3c; margin: 24px 0 0; line-height: 1.5; }
                    .sign-off strong { font-weight: 600; }
                    .footer { text-align: center; padding: 20px 32px 0; }
                    .footer-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
                    .footer-links { margin: 10px 0 0; }
                    .footer-links a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280; text-decoration: none; margin: 0 12px; }
                    .footer-links a:hover { color: #d65c3a; }
                    .footer-copy { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #b0b5c3; margin: 10px 0 0; }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="logo-area">
                        <img src="https://res.cloudinary.com/dqrw5ogdh/image/upload/v1781892368/logoorange_lunymd.png" alt="Event VNV" width="80" style="display:inline-block;" />
                    </div>

                    <div class="card">
                        <div class="hero">
                            <p class="hero-label">You're in</p>
                            <h1 class="hero-title">Welcome, ${safeName}</h1>
                            <p class="hero-subtitle">We're glad you're here. Let's get you set up.</p>
                        </div>

                        <div class="card-body">
                            <p class="body-text">Your Event VNV account is ready. Here's how to make the most of it:</p>

                            <div class="step">
                                <div class="step-header">
                                    <span class="step-icon"><span>1</span></span>
                                    <span class="step-title">Complete your profile</span>
                                </div>
                                <p class="step-desc">Add your details so others can find and connect with you at events.</p>
                            </div>

                            <div class="step">
                                <div class="step-header">
                                    <span class="step-icon"><span>2</span></span>
                                    <span class="step-title">Discover events</span>
                                </div>
                                <p class="step-desc">Browse upcoming events, save the ones you like, and RSVP in seconds.</p>
                            </div>

                            <div class="step">
                                <div class="step-header">
                                    <span class="step-icon"><span>3</span></span>
                                    <span class="step-title">Connect with people</span>
                                </div>
                                <p class="step-desc">Meet attendees, speakers, and organizers — build real relationships.</p>
                            </div>

                            <div class="cta-wrapper">
                                <a href="#" class="cta-button">Set up your profile</a>
                            </div>

                            <p class="sign-off">Questions? We're always here at <strong><a href="mailto:support@eventvnv.com" style="color: #d65c3a; text-decoration: none;">support@eventvnv.com</a></strong>.<br /><br />Warmly,<br /><strong>The Event VNV Team</strong></p>
                        </div>
                    </div>

                    <div class="footer">
                        <p class="footer-text">Sent to ${safeEmail}</p>
                        <div class="footer-links">
                            <a href="mailto:support@eventvnv.com">Help & Support</a>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <p class="footer-copy">&copy; ${new Date().getFullYear()} Event VNV. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};