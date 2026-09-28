import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  registerSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Domirush ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("Failed to start Domirush server:", err);
  process.exit(1);
});
