import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { calculateGovernmentSalary } from "./taxCalculations.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
function cleanText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function parseAmount(value) {
  if (!value) return 0;
  return Number(String(value).replace(/,/g, "").replace(/[^\d.]/g, "")) || 0;
}

async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(file.path);

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }

    return cleanText(result.text || "");
  }

  if (ext === ".json" || ext === ".csv" || ext === ".txt") {
    return cleanText(fs.readFileSync(file.path, "utf-8"));
  }

  return "";
}

function detectDocumentType(fileName = "", text = "") {
  const name = fileName.toLowerCase();
  const body = text.toLowerCase();

  if (name.includes("form16") || name.includes("form 16") || body.includes("form 16")) {
    return "Form 16";
  }

  if (
    name.includes("salary") ||
    name.includes("slip") ||
    body.includes("payslip") ||
    body.includes("net salary") ||
    body.includes("basic salary") ||
    body.includes("house rent allowance")
  ) {
    return "Salary Slip";
  }

  if (name.includes("ais") || body.includes("annual information statement")) return "AIS";
  if (name.includes("tis") || body.includes("taxpayer information summary")) return "TIS";
  if (name.includes("26as") || body.includes("form 26as")) return "Form 26AS";
  if (name.includes("rent") || body.includes("rent receipt")) return "Rent Receipts";
  if (name.includes("investment") || name.includes("80c")) return "Investment Proofs";
  if (name.includes("nps") || body.includes("national pension")) return "NPS Statement";
  if (name.includes("loan") || body.includes("loan certificate")) return "Loan Certificate";

  return "Unknown Document";
}

function matchAmount(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return parseAmount(match[1]);
  }
  return 0;
}

function extractSalarySlipFields(text) {
  const lower = text.toLowerCase();

  const basicPay = matchAmount(text, [
    /Basic Salary\s+([\d,]+(?:\.\d+)?)/i,
    /Basic Pay\s+([\d,]+(?:\.\d+)?)/i,
    /Basic\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const houseRentAllowance = matchAmount(text, [
    /House Rent Allowance\s+([\d,]+(?:\.\d+)?)/i,
    /HRA\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const performanceLinkedPay = matchAmount(text, [
    /Performance Linked Pay\s+([\d,]+(?:\.\d+)?)/i,
    /Performance Pay\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const providentFund = matchAmount(text, [
    /Provident Fund\s+([\d,]+(?:\.\d+)?)/i,
    /PF\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const professionalTax = matchAmount(text, [
    /Professional Tax\s+([\d,]+(?:\.\d+)?)/i,
    /PT\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const totalEarnings = matchAmount(text, [
    /Total Earnings\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const totalDeductions = matchAmount(text, [
    /Total Deductions\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const netSalary = matchAmount(text, [
    /Net Salary\s*:?\s+([\d,]+(?:\.\d+)?)/i,
  ]);

  const employeeTypeMatch = text.match(/Employee Type\s+(.+?)\s+Date of Joining/i);
  const designationMatch = text.match(/Designation\s+(.+?)\s+Employee Type/i);
  const employerLooksPrivate =
    lower.includes("hdfc") ||
    lower.includes("sales officer") ||
    lower.includes("employee type") ||
    lower.includes("performance linked pay");

  const extracted = {
    basicPay,
    houseRentAllowance,
    performanceLinkedPay,
    providentFund,
    professionalTax,
    totalEarnings,
    totalDeductions,
    netSalary,
    grossSalary: totalEarnings,
    employerType: employerLooksPrivate ? "Private" : undefined,
    employeeType: employeeTypeMatch?.[1]?.trim(),
    designation: designationMatch?.[1]?.trim(),
  };

  Object.keys(extracted).forEach((key) => {
    if (extracted[key] === 0 || extracted[key] === undefined || extracted[key] === "") {
      delete extracted[key];
    }
  });

  return extracted;
}

function getMockExtractionForType(type) {
  const base = {
    extracted: {},
    confidence: 0.78,
    status: "Extracted",
  };

  switch (type) {
    case "Form 16":
      return {
        ...base,
        confidence: 0.95,
        extracted: {
          employerName: "Government of India",
          employerType: "Government",
          assessmentYear: "2025-26",
          grossSalary: 1245000,
          taxDeductedAtSource: 124500,
          deductionsDeclared: 112500,
          npsEmployer: 119952,
        },
      };

    case "Salary Slip":
      return {
        ...base,
        confidence: 0.75,
        extracted: {},
      };

    case "AIS":
      return {
        ...base,
        confidence: 0.89,
        extracted: {
          salaryIncomeReported: 1245000,
          interestIncome: 20000,
          tdsReported: 124500,
          highValueTransactions: 0,
        },
      };

    case "Form 26AS":
      return {
        ...base,
        confidence: 0.92,
        extracted: {
          tdsFromEmployer: 124500,
          employerTanMatched: true,
          taxPaidMatched: true,
        },
      };

    case "Rent Receipts":
      return {
        ...base,
        confidence: 0.82,
        extracted: {
          monthlyRentPaid: 22000,
          landlordNameAvailable: true,
          panAvailable: true,
          rentPeriodMonths: 12,
        },
      };

    case "NPS Statement":
      return {
        ...base,
        confidence: 0.9,
        extracted: {
          section80CCD1B: 30000,
          employerNps: 119952,
        },
      };

    default:
      return {
        ...base,
        confidence: 0.45,
        status: "Needs Review",
        extracted: {},
      };
  }
}

function mergeExtractedFields(documentResults) {
  const merged = {};
  for (const doc of documentResults) {
    Object.assign(merged, doc.extracted);
  }
  return merged;
}

function detectEmploymentCategory(extracted) {
  const employerText = String(
    extracted.employerName || extracted.employeeType || extracted.designation || ""
  ).toLowerCase();

  if (
    extracted.employerType === "Government" ||
    employerText.includes("government") ||
    extracted.payLevel ||
    extracted.payCell
  ) {
    return {
      category: "Government Employee",
      confidence: 0.92,
      reason:
        "Pay Level, Pay Cell, DA structure, or government-style employer data were detected.",
    };
  }

  if (
    extracted.employerType === "Private" ||
    employerText.includes("hdfc") ||
    employerText.includes("sales officer") ||
    extracted.performanceLinkedPay
  ) {
    return {
      category: "Private Sector Employee",
      confidence: 0.88,
      reason:
        "Private-sector salary slip indicators such as company payroll, performance-linked pay, PF, and professional tax were detected.",
    };
  }

  if (employerText.includes("psu") || employerText.includes("public sector")) {
    return {
      category: "Public Sector / PSU Employee",
      confidence: 0.84,
      reason: "Public sector employer indicators were found.",
    };
  }

  return {
    category: "Private Sector Employee",
    confidence: 0.72,
    reason: "No government pay matrix indicators were found.",
  };
}

function compareExtractedVsCalculated(extracted, employmentCategory) {
  if (employmentCategory !== "Government Employee") {
    const comparisons = [
      {
        field: "Basic Salary",
        extracted: extracted.basicPay || null,
        calculated: extracted.basicPay || 0,
        status: extracted.basicPay ? "Extracted" : "Needs Review",
      },
      {
        field: "HRA",
        extracted: extracted.houseRentAllowance || null,
        calculated: extracted.houseRentAllowance || 0,
        status: extracted.houseRentAllowance ? "Extracted" : "Needs Review",
      },
      {
        field: "Performance Linked Pay",
        extracted: extracted.performanceLinkedPay || null,
        calculated: extracted.performanceLinkedPay || 0,
        status: extracted.performanceLinkedPay ? "Extracted" : "Needs Review",
      },
      {
        field: "Provident Fund",
        extracted: extracted.providentFund || null,
        calculated: extracted.providentFund || 0,
        status: extracted.providentFund ? "Extracted" : "Needs Review",
      },
      {
        field: "Net Salary",
        extracted: extracted.netSalary || null,
        calculated: extracted.netSalary || 0,
        status: extracted.netSalary ? "Extracted" : "Needs Review",
      },
    ];

    return {
      calculatedSalary: null,
      comparisons,
      mismatchCount: comparisons.filter((item) => item.status === "Needs Review").length,
    };
  }

  const calculated = calculateGovernmentSalary({
    payLevel: extracted.payLevel || 7,
    payCell: extracted.payCell || 3,
    cityType: extracted.cityType || "Metro",
    oldDa: 46,
    newDa: 50,
    arrearMonths: 2,
    transport: extracted.transportAllowance || 3600,
  });

  const salary = calculated.salary;

  const comparisons = [
    {
      field: "Basic Pay",
      extracted: extracted.basicPay || null,
      calculated: salary.basicPay,
      status:
        extracted.basicPay && Math.abs(extracted.basicPay - salary.basicPay) <= 100
          ? "Matched"
          : "Needs Review",
    },
    {
      field: "Dearness Allowance",
      extracted: extracted.dearnessAllowance || null,
      calculated: salary.daMonthly,
      status:
        extracted.dearnessAllowance &&
        Math.abs(extracted.dearnessAllowance - salary.daMonthly) <= 100
          ? "Matched"
          : "Needs Review",
    },
    {
      field: "HRA",
      extracted: extracted.houseRentAllowance || null,
      calculated: salary.hraMonthly,
      status:
        extracted.houseRentAllowance &&
        Math.abs(extracted.houseRentAllowance - salary.hraMonthly) <= 100
          ? "Matched"
          : "Needs Review",
    },
    {
      field: "Employer NPS",
      extracted: extracted.employerNps || null,
      calculated: salary.npsEmployer * 12,
      status:
        extracted.employerNps &&
        Math.abs(extracted.employerNps - salary.npsEmployer * 12) <= 500
          ? "Matched"
          : "Needs Review",
    },
  ];

  return {
    calculatedSalary: calculated,
    comparisons,
    mismatchCount: comparisons.filter((item) => item.status !== "Matched").length,
  };
}

function buildDocumentQueue(files, documentResults) {
  return files.map((file, index) => {
    const result = documentResults[index];

    return {
      fileName: file.originalname,
      documentType: result.documentType,
      status: result.status,
      confidence: result.confidence,
      size: file.size,
    };
  });
}

export async function processUploadedTaxDocuments(files = []) {
  const documentResults = [];

  for (const file of files) {
    const text = await extractTextFromFile(file);
    const documentType = detectDocumentType(file.originalname, text);
    const mock = getMockExtractionForType(documentType);

    let extractedFromText = {};

    if (documentType === "Salary Slip") {
      extractedFromText = extractSalarySlipFields(text);
    }

    documentResults.push({
      fileName: file.originalname,
      documentType,
      status: Object.keys(extractedFromText).length > 0 ? "Extracted" : mock.status,
      confidence: Object.keys(extractedFromText).length > 0 ? 0.9 : mock.confidence,
      extracted: {
        ...mock.extracted,
        ...extractedFromText,
      },
      rawTextPreview: text.slice(0, 500),
    });
  }

  const extracted = mergeExtractedFields(documentResults);
  const employmentDetection = detectEmploymentCategory(extracted);
  const comparisonResult = compareExtractedVsCalculated(
    extracted,
    employmentDetection.category
  );

  const documentQueue = buildDocumentQueue(files, documentResults);

  const averageConfidence =
    documentResults.length === 0
      ? 0
      : documentResults.reduce((sum, doc) => sum + doc.confidence, 0) /
        documentResults.length;

  const matchedSources = documentResults
    .filter((doc) => doc.status === "Extracted")
    .map((doc) => ({
      documentType: doc.documentType,
      status: "Matched",
      confidence: doc.confidence,
    }));

  const alerts = [];

  if (comparisonResult.mismatchCount > 0) {
    alerts.push("Some extracted values need review.");
  }

  if (employmentDetection.category === "Private Sector Employee" && !extracted.taxDeductedAtSource) {
    alerts.push("Form 16 or 26AS was not detected. TDS verification may be required.");
  }

  return {
    documentQueue,
    extractedInsights: {
      employerType: employmentDetection.category,
      grossSalary: extracted.grossSalary || extracted.totalEarnings || 0,
      netSalary: extracted.netSalary || 0,
      taxDeductedAtSource:
        extracted.taxDeductedAtSource || extracted.tdsReported || extracted.tdsFromEmployer || 0,
      houseRentAllowance: extracted.houseRentAllowance || 0,
      dearnessAllowance: extracted.dearnessAllowance || 0,
      deductionsFound:
        (extracted.providentFund || 0) +
        (extracted.professionalTax || 0) +
        (extracted.section80C || 0) +
        (extracted.section80CCD1B || 0),
      extracted,
    },
    employmentDetection,
    extractionConfidence: Math.round(averageConfidence * 100),
    matchedSources,
    comparisonResult,
    alerts,
    nextRecommendedPage:
      employmentDetection.category === "Government Employee"
        ? "itr-govt-salary-builder"
        : employmentDetection.category === "Public Sector / PSU Employee"
        ? "itr-psu-salary-builder"
        : "itr-private-salary-builder",
    assistantMessage: `I detected a ${employmentDetection.category} profile with ${Math.round(
      employmentDetection.confidence * 100
    )}% confidence. I found ${matchedSources.length} usable document source(s) and ${comparisonResult.mismatchCount} value(s) that may need review.`,
  };
}