import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import featureRequestRoutes from "./routes/featureRequests.js";
import organizationRoutes from "./routes/organizations.js";
import budgetRoutes from "./routes/budgets.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
      },
      credentials: true,
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/budgets", budgetRoutes);
  app.use("/api/admin/organizations", organizationRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/feature-requests", featureRequestRoutes);

  return app;
}
