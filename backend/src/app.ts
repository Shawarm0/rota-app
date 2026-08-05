import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttpModule from "pino-http";
const pinoHttp = pinoHttpModule as unknown as typeof pinoHttpModule.default;
import { IncomingMessage } from "http";
import { env } from "./config/env.js";
import logger from "./lib/logger.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import userRoutes from "./routes/user.routes.js";
import rotaRoutes from "./routes/rota.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import holidayRoutes from "./routes/holiday.routes.js";
import swapRoutes from "./routes/swap.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req: IncomingMessage) => req.url === "/api/v1/health" } }));
app.use(generalLimiter);

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/rotas", rotaRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/holidays", holidayRoutes);
app.use("/api/v1/swaps", swapRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use(errorHandler);

if (env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "public");
  app.use(express.static(clientDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
