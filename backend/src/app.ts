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

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
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
  app.use("/api/feature-requests", featureRequestRoutes);

  return app;
}
