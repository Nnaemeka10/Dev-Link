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
                            <p><strong>This link expires in 1 hour.</strong><br />If you didn't request a password reset, you can safely ignore this email - your account is secure.</p>
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
                                <p class="step-desc">Add your details.</p>
                            </div>

                            <div class="step">
                                <div class="step-header">
                                    <span class="step-icon"><span>2</span></span>
                                    <span class="step-title">Discover halls and services and save the ones you like</span>
                                </div>
                                <p class="step-desc">Browse halls and services.</p>
                            </div>

                            <div class="step">
                                <div class="step-header">
                                    <span class="step-icon"><span>3</span></span>
                                    <span class="step-title">Book halls and services</span>
                                </div>
                                <p class="step-desc">Seamless booking flow. Book with confidence.</p>
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