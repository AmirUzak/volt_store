import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { collectDefaultMetrics, Registry } from "prom-client";
import authRoutes from "./routes/auth";
import productsRoutes from "./routes/products";
import ordersRoutes from "./routes/orders";
import cartRoutes from "./routes/cart";
import reviewsRoutes from "./routes/reviews";
import chatRoutes from "./routes/chat.route";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOrigins = FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry, prefix: "volt_backend_" });

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "VOLT backend is running" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/chat", chatRoutes);

// Legacy aliases to avoid breaking existing clients during migration.
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/chat", chatRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});
