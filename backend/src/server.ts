
import http from "http";
import app from "./app.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { initializeSocketIO } from "./lib/socket.js";
import { startPostgresListener } from "./lib/listenBridge.js";
import { processWebhookEvents } from "./modules/payments/utils/webhookProcessor.js"; 
import { processAutomatedEscrowPayouts } from "./modules/payments/utils/payoutWorker.js"; 
import { runReconciliation } from "./modules/payments/utils/reconciliation.js";

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

    // Initialize Payment Cron Jobs
    // Process webhooks every 5 seconds
    setInterval(() => processWebhookEvents().catch(console.error), 5000);
    
    // Process payouts every 15 minutes
    setInterval(() => processAutomatedEscrowPayouts().catch(console.error), 15 * 60 * 1000);
    
    // Run reconciliation every 15 minutes
    setInterval(() => runReconciliation().catch(console.error), 15 * 60 * 1000);


    // 5. Start listening for requests
    httpServer.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
      console.log(` Socket.IO is ready for connections.`);
      console.log(` Escrow and payout workers are active`)
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Exit the process with an error code
  }
}

letsgo();