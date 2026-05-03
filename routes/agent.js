import express from "express";
import { handleAgentMessage } from "../services/agentOrchestrator.js";

const router = express.Router();

router.post("/message", (req, res) => {
  try {
    const { pageId, question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        ok: false,
        error: "Question is required",
      });
    }

    const result = handleAgentMessage({
      pageId,
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