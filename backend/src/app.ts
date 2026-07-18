import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './lib/env.js';
import authRoutes from './modules/auth/routes/auth.route.js';
import listingsRoutes from './modules/listings/routes/listings.route.js';
import bookingRoutes from './modules/bookings/routes/booking.route.js';
import paymentRoutes from './modules/payments/routes/payment.route.js';

const app = express();

//global middleware

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
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl === '/api/payments/webhook') {
      req.rawBody = buf.toString();
    }
  }
}));


//routes
app.use("/api/auth", authRoutes)
app.use("/api/listings", listingsRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/payments", paymentRoutes)

//health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        message: 'Server is healthy'
     });
});

export default app;