import { Resend } from "resend";
import { ENV } from "./env.js";

if (!ENV.RESEND_API_KEY) {
    console.error(" RESEND_API_KEY is missing from environment variables!");
}

export const resend = new Resend(ENV.RESEND_API_KEY);

export const getSender = () => {
    // Provide safe fallbacks in case env vars are missing
    const email = ENV.EMAIL_FROM || "support@eventvnv.com";
    const name = ENV.EMAIL_FROM_NAME || "Event VNV";
    
    return {
        email,
        name,
        // Pre-format the string here so emailHandler doesn't have to
        formatted: `${name} <${email}>`
    };
};