import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import monitorRoutes from "./routes/monitorRoutes.js";
import automataRoutes from "./routes/automataRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { recordActivity } from "./services/activityLog.js";
import { configureSockets } from "./sockets/index.js";

const app = express();
const server = http.createServer(app);
const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const isAllowedOrigin = (origin) => !origin
  || configuredOrigins.includes(origin)
  || origin === "http://localhost:5173"
  // Allow Vercel preview and production URLs for this project only.
  || /^https:\/\/[a-z0-9-]+-sd-a2d1\.vercel\.app$/i.test(origin);
const corsOrigin = (origin, callback) => callback(null, isAllowedOrigin(origin));
const io = new Server(server, { cors: { origin: corsOrigin, methods: ["GET", "POST"] } });
app.set("io", io);
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => recordActivity({ source: "http", method: req.method, endpoint: req.originalUrl, status: res.statusCode, durationMs: Date.now() - started }));
  next();
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/monitor", monitorRoutes);
app.use("/api/automata", automataRoutes);
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);
configureSockets(io);

const port = Number(process.env.PORT) || 5000;
connectDatabase().then(() => server.listen(port, () => console.log(`API and Socket.IO listening on port ${port}`)))
  .catch((error) => { console.error("Failed to start:", error.message); process.exit(1); });

function shutdown() {
  io.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
