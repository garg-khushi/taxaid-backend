import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import itrRoutes from "./routes/itr.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "TaxAid backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/itr", itrRoutes);
app.use("/api/ai", aiRoutes);

app.listen(PORT, () => {
  console.log(`TaxAid backend running on http://localhost:${PORT}`);
});