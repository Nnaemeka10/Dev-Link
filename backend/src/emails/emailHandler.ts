import { resend, sender } from "../lib/resend.js";

import { 
    getVerificationEmailTemplate, 
    getPasswordResetEmailTemplate, 
    getPasswordResetSuccessTemplate, 
    getWelcomeEmailTemplate
} from "./emailTemplates.js";

export const emailService = {
    async sendVerificationEmail(email: string, code: string) {
        try {
            const { subject, html } = getVerificationEmailTemplate(code, email);

            const { data, error} = await resend.emails.send({
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
        } catch (error: any) {
            console.error("Unexpected error in sendVerificationEmail:", error);
            throw error;
        }
    },

    async sendWelcomeEmail(email: string, userName: string) {
        try {
            const { subject, html } = getWelcomeEmailTemplate(userName, email);

            const { data, error} = await resend.emails.send({
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

        } catch (error: any) {
            console.error("Error in sendWelcomeEmail:", error);
            throw error;
        }
    },


    async sendPasswordResetEmail(email: string, resetToken: string) {
        try {
            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            const { subject, html } = getPasswordResetEmailTemplate(resetUrl, email);

            const { data, error} = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: [email],
                subject,
                html
            });

            if (error) {
                console.error("Error sending password reset email:", error);
                throw new Error("Failed to send password reset email");
            }

            console.log("Password reset email sent successfully:", data);
            return data;

        } catch (error: any) {
            console.error("Error in sendPasswordResetEmail:", error);
            throw error;
        }
    },
    

    async sendPasswordResetSuccessEmail(email: string) {
        try {
            const { subject, html } = getPasswordResetSuccessTemplate(email);

            const { data, error} = await resend.emails.send({
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
        } catch (error: any) {
            console.error("Error in sendPasswordResetSuccessEmail:", error);
            throw error;
        }
    }
};