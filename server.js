import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import itrRoutes from "./routes/itr.js";
import aiRoutes from "./routes/ai.js";
import agentRoutes from "./routes/agent.js";
import uploadRoutes from "./routes/upload.js";
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
app.get("/", (req, res) => {
  res.send(`
    <h1>TaxAid Backend is Live</h1>
    <p>This is the API server for TaxAid.</p>
    <ul>
      <li><a href="/api/health">Health Check</a></li>
      <li>POST /api/agent/message</li>
      <li>POST /api/itr/government-salary</li>
      <li>POST /api/itr/allowance-review</li>
      <li>POST /api/itr/deduction-optimizer</li>
    </ul>
  `);
});
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "TaxAid backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/itr", itrRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/upload", uploadRoutes);
app.listen(PORT, () => {
  console.log(`TaxAid backend running on http://localhost:${PORT}`);
});
