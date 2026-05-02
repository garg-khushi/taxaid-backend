import express from "express";
import { answerWithFallbackAgent } from "../services/agentService.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { page, question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        ok: false,
        error: "Question is required",
      });
    }

    const result = answerWithFallbackAgent({
      page,
      question,
      context,
    });

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;