import "dotenv/config";

function required(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}


export const ENV = {
    PORT: process.env.PORT,
    POSTGRES_URI: process.env.POSTGRES_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    ARCJET_KEY: process.env.ARCJET_KEY,
    ARCJET_ENV: process.env.ARCJET_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    PAYSTACK_SECRET_KEY: required('PAYSTACK_SECRET_KEY'),
}

// Add this safety check to catch configuration errors instantly
if (!ENV.RESEND_API_KEY) {
    console.error("❌ CRITICAL: RESEND_API_KEY is missing from environment variables!");
}
