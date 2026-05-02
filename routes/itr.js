import express from "express";
import {
  calculateGovernmentSalary,
  calculateAllowanceReview,
  calculateDeductions,
  detectITRRisks,
} from "../services/taxCalculations.js";

const router = express.Router();

router.post("/government-salary", (req, res) => {
  try {
    const result = calculateGovernmentSalary(req.body);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/allowance-review", (req, res) => {
  try {
    const result = calculateAllowanceReview(req.body);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/deduction-optimizer", (req, res) => {
  try {
    const result = calculateDeductions(req.body);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/risk-check", (req, res) => {
  try {
    const result = detectITRRisks(req.body);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;