import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './lib/env.js';
import authRoutes from './modules/auth/routes/auth.route.js';
import listingsRoutes from './modules/listings/routes/listings.route.js';
import bookingRoutes from './modules/bookings/routes/booking.route.js';
import paymentRoutes from './modules/payments/routes/payment.route.js';
import chatRoutes from './modules/chat/routes/chat.route.js';
import profileRoutes from './modules/profile/routes/profile.routes.js';
import vendorRoutes from './modules/vendor/routes/vendor.routes.js';
import vendorVerificationRoutes from './modules/vendor/routes/vendorVerification.routes.js';
import locationRoutes from './modules/locations/routes/location.route.js';

const app = express();

//global middleware

//  SECURITY FIX (trust proxy)
// Behind nginx / Render / Railway / a load balancer, req.ip is the PROXY's IP
// unless Express is told how many hops to trust. The Paystack IP allow-list on
// /api/payments/transfer-approval depends on req.ip being the real client IP.
// 1 = one proxy hop in front of the app (the common setup). Increase it if you
// have a longer proxy chain (e.g. CDN - load balancer - app = 2).
app.set('trust proxy', 1);

// (helmet security headers) 
// Sets (among others):
//   Content-Security-Policy          - blocks injected content on any HTML we serve
//   Strict-Transport-Security (HSTS) - forces HTTPS for 180 days incl. subdomains
//   X-Frame-Options: DENY            - API responses can never be framed
//   X-Content-Type-Options: nosniff  - browsers can't MIME-sniff our responses
//   Referrer-Policy, Cross-Origin-*-Policy, and removes X-Powered-By
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                // Cloudinary hosts our listing/avatar images
                imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
            },
        },
        // HSTS: 180 days. Browsers ignore this header on plain HTTP, so local
        // dev over http://localhost is unaffected.
        hsts: { maxAge: 15552000, includeSubDomains: true, preload: false },
        // X-Frame-Options: DENY
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
);

const allowedOrigins = [
  "http://localhost:3000",
  ENV.CLIENT_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile apps / postman

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(cookieParser());

// JSON parser with raw-body capture for Paystack HMAC verification.
// The HMAC must be computed over the exact bytes Paystack signed, so we keep
// the raw string BEFORE it is parsed.
// capture the raw body for BOTH Paystack-called endpoints
// (the webhook ingestor AND /transfer-approval) - previously only the webhook
// path was captured, so /transfer-approval could not verify signatures.
app.use(express.json({
  verify: (req: any, res, buf) => {
    const url = req.originalUrl.split('?')[0];
    if (url === '/api/payments/webhook' || url === '/api/payments/transfer-approval') {
      req.rawBody = buf.toString();
    }
  }
}));


//routes
app.use("/api/auth", authRoutes)
app.use("/api/listings", listingsRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/chat", chatRoutes) 
app.use("/api/profile", profileRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/vendor/verification", vendorVerificationRoutes); // Vendor verification routes
app.use('/api/locations', locationRoutes);

//health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        message: 'Server is healthy'
     });
});

export default app;