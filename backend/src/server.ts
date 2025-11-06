import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { ENV } from './lib/env.js';
import { connectDB } from './lib/db.js';

import authRoutes from './routes/auth.route.js';



//app initialization
const app = express(); 
const PORT = ENV.PORT || 3000;
const __dirname = path.resolve();

//middlewares
app.use(express.json()); //to be able to read json data from client
app.use(cookieParser()); //to be able to read cookies
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true, })) //to allow requests from client url (frontend URL) to communicate with backend

//routes
app.use("/api/auth", authRoutes);  //auth routes

//make ready for deployment
if (ENV.NODE_ENV === 'production') {
    app.use (express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (_, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    })
}

//server listen
app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`);
    //connect to database
    connectDB();
});