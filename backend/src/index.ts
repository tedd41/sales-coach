import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pinoHttp from "pino-http";
import { logger } from "./services/logService";
import repRoutes from "./routes/repRoutes";
import intelligenceRoutes from "./routes/intelligenceRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import syncRoutes from "./routes/syncRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
    customErrorMessage: (req, res) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
  }),
);

// Routes
app.use("/api/v1/reps", repRoutes);
app.use("/api/v1/intelligence", intelligenceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/sync", syncRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`🚀 Sales Coach API running on http://localhost:${PORT}`);
});
