import express from "express";
import multer from "multer";
import path from "path";
import { processUploadedTaxDocuments } from "../services/documentExtraction.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".pdf", ".png", ".jpg", ".jpeg", ".json", ".csv", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExt.includes(ext)) {
      return cb(new Error("Only PDF, image, JSON, and CSV files are supported."));
    }

    cb(null, true);
  },
});

router.post("/autofill", upload.array("documents", 10), async (req, res) => {
  try {
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "At least one document is required.",
      });
    }

    const result = await processUploadedTaxDocuments(files);

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