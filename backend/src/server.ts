import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';

import authRoutes from './routes/auth.route.js';
import { fileURLToPath } from "url";


//app initialization

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express(); 
const PORT = Number(ENV.PORT) || 3000;


//middlewares
app.use(express.json()); //to be able to read json data from client
app.use(cookieParser()); //to be able to read cookies
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true, })) //to allow requests from client url (frontend URL) to communicate with backend

//routes
app.use("/api/auth", authRoutes);  //auth routes

//make ready for deployment
if (ENV.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  app.use((_, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

//server listen
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
    console.log( __dirname)
    //connect to database
    connectDB();
});