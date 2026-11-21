import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./src/server/socket";

import { handleConnector } from "./src/server/platform";
import { roomManager } from "./src/server/roomManager";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (req.url === "/api/platform/connector") {
      void handleConnector(req, res);
      return;
    }
    void handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  registerSocketHandlers(io);
  setInterval(() => roomManager.sweepStaleRooms(), 60000).unref();

  httpServer.listen(port, hostname, () => {
    console.log(`> Domirush ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("Failed to start Domirush server:", err);
  process.exit(1);
});
