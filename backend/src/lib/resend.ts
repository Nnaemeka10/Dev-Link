import { Resend } from "resend";
import { ENV } from "./env.js";

export const resend = new Resend(ENV.RESEND_API_KEY);

export const getSender = () => ({
    email: ENV.EMAIL_FROM,
    name: ENV.EMAIL_FROM_NAME,
});
