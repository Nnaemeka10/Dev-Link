// import express from 'express';
// import cookieParser from 'cookie-parser';
// import path from 'path';
// import cors from 'cors';
// import { ENV } from './lib/env.js';
// import { connectDB } from './lib/db.js';


// import authRoutes from './routes/auth.route.js';
// import { fileURLToPath } from "url";


// //app initialization

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const app = express(); 

// //middlewares
// app.use(express.json()); //to be able to read json data from client
// app.use(cookieParser()); //to be able to read cookies
// app.use(cors({ origin: ENV.CLIENT_URL, credentials: true, })) //to allow requests from client url (frontend URL) to communicate with backend

// //routes
// app.use("/api/auth", authRoutes);  //auth routes

// //make ready for deployment
// if (ENV.NODE_ENV === "production") {
//   const frontendPath = path.join(__dirname, "../frontend/dist");

//   app.use(express.static(frontendPath));

//   app.use((_, res) => {
//     res.sendFile(path.join(frontendPath, "index.html"));
//   });
// }

// //server listen
// app.listen(PORT, ()=> {
//     console.log(`Server is running on port ${PORT}`);
//     console.log( __dirname)
//     //connect to database
//     connectDB();
// });

// import app from "./app.js";
// import { connectDB } from "./lib/db.js";
// import { ENV } from "./lib/env.js";
// const PORT = ENV.PORT || 8080;


import http from "http";
import app from "./app.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { initializeSocketIO } from "./lib/socket.js";
import { startPostgresListener } from "./lib/listenBridge.js";

const PORT = ENV.PORT || 8080;

async function letsgo() {
  try {
    // 1. Connect to Database and run migrations
    await connectDB();

    // 2. Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // 3. Initialize Socket.IO and attach to HTTP server
    initializeSocketIO(httpServer);

    // 4. Start Postgres LISTEN/NOTIFY bridge
    await startPostgresListener();

    // 5. Start listening for requests
    httpServer.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
      console.log(` Socket.IO is ready for connections.`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Exit the process with an error code
  }
}

letsgo();