import { resend, getSender } from "../lib/resend.js";
import { getVerificationEmailTemplate, getPasswordResetEmailTemplate, getPasswordResetSuccessTemplate, getWelcomeEmailTemplate } from "./emailTemplates.js";
export const emailService = {
    async sendVerificationEmail(email, code) {
        try {
            const { subject, html } = getVerificationEmailTemplate(code, email);
            const sender = getSender();
            const { data, error } = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: [email],
                subject,
                html,
            });
            if (error) {
                console.error("Error sending verification email:", error);
                throw new Error("Failed to send verification email");
            }
            console.log("Verification email sent successfully:", data);
            return data;
        }
        catch (error) {
            console.error("Unexpected error in sendVerificationEmail:", error);
            throw error;
        }
    },
    async sendWelcomeEmail(email, userName) {
        try {
            const { subject, html } = getWelcomeEmailTemplate(userName, email);
            const sender = getSender();
            const { data, error } = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: [email],
                subject,
                html
            });
            if (error) {
                console.error("Error sending welcome email:", error);
                throw new Error("Failed to send welcome email");
            }
            console.log("Welcome email sent successfully:", data);
            return data;
        }
        catch (error) {
            console.error("Error in sendWelcomeEmail:", error);
            throw error;
        }
    },
    async sendPasswordResetEmail(email, resetToken, resetLink) {
        try {
            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetLink}`;
            const { subject, html } = getPasswordResetEmailTemplate(resetUrl, email, resetToken);
            const sender = getSender();
            const { data, error } = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: [email],
                subject,
                html
            });
            if (error) {
                console.error("Error sending password reset email:", error);
                throw new Error(`Failed to send password reset email`);
            }
            console.log("Password reset email sent successfully:", data);
            return data;
        }
        catch (error) {
            console.error("Error in sendPasswordResetEmail:", error);
            throw error;
        }
    },
    async sendPasswordResetSuccessEmail(email) {
        try {
            const { subject, html } = getPasswordResetSuccessTemplate(email);
            const sender = getSender();
            const { data, error } = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: [email],
                subject,
                html
            });
            if (error) {
                console.error("Error sending password reset success email:", error);
                throw new Error("Failed to send confirmation email");
            }
            console.log("Password reset success email sent successfully:", data);
            return data;
        }
        catch (error) {
            console.error("Error in sendPasswordResetSuccessEmail:", error);
            throw error;
        }
    }
};
//# sourceMappingURL=emailHandler.js.map